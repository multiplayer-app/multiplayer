import crypto from 'crypto'
import redis, { client as redisClient } from '@multiplayer/redis'
import logger from '@multiplayer/logger'
import {
  ANALYTICS_DB_ENGINE,
  REDIS_STORE_LEADER_KEY,
  STORE_LEADER_RENEW_INTERVAL_MS,
  STORE_LEADER_TTL_SECONDS,
} from '../config'

// Redis-lease leader election for the DuckDB analytics store. Exactly one replica
// (the leader) performs all local DuckDB I/O; followers forward Store calls to it via
// AMQP request/reply (src/store/remote/remote.store.ts, src/store/leader-listener.ts).
// Routing goes entirely through the message broker by queue name, so - unlike an
// HTTP-based design - a replica never needs to know another replica's network address;
// the lease value only needs to identify WHO is leader (for observability/logging), not
// WHERE to reach them.
//
// Renewal is GET-compare + SET XX (no Lua, matching repo conventions - see
// api-service/src/kafka.ts acquireLock). The GET->SET race is benign here: worst case
// two pods briefly write to their own local files, which is exactly the pre-feature
// multi-replica behavior, bounded by one renew interval.

export type LeaderState = 'idle' | 'unknown' | 'leader' | 'follower'

export interface LeadershipHooks {
  onGain?: () => void
  onLoss?: () => void
}

const MAX_CONSECUTIVE_REDIS_FAILURES = 3
const WAIT_FOR_LEADER_POLL_MS = 500

// Opaque per-process identifier - purely for logs/observability (e.g. "who is leader
// right now"), never used for addressing.
const selfId = crypto.randomBytes(8).toString('hex')

let state: LeaderState = 'idle'
let leaderId: string | null = null
let timer: NodeJS.Timeout | undefined
let hooks: LeadershipHooks = {}
let consecutiveRedisFailures = 0
let tickInFlight: Promise<void> | undefined

export const getSelfId = (): string => selfId

export const getState = (): LeaderState => state

export const isLeader = (): boolean => state === 'leader'
  // Redis unreachable: an ex-leader keeps acting as leader (availability over
  // strictness - redis being down already degrades most of the service).
  || (state === 'unknown' && leaderId === selfId)

export const getLeaderId = (): string | null => leaderId

// Hooks fire on changes of the EFFECTIVE leadership (isLeader()), not the raw state
// label - an ex-leader sitting in 'unknown' (redis blip) is still acting leader and
// must only get onLoss once it actually observes another pod holding the lease.
const transitionTo = (nextState: LeaderState, nextLeaderId: string | null) => {
  const wasActingLeader = isLeader()
  const previousState = state

  state = nextState
  leaderId = nextLeaderId

  if (previousState !== nextState) {
    logger.info(
      { previousState, state: nextState, leaderId: nextLeaderId },
      '[STORE-LEADER] Leadership state changed',
    )
  }

  const actingLeader = isLeader()

  if (!wasActingLeader && actingLeader) {
    hooks.onGain?.()
  } else if (wasActingLeader && !actingLeader) {
    hooks.onLoss?.()
  }
}

const tick = async (): Promise<void> => {
  try {
    const currentValue = await redis.get(REDIS_STORE_LEADER_KEY)

    if (currentValue === selfId) {
      await redisClient.set(REDIS_STORE_LEADER_KEY, selfId, {
        XX: true,
        EX: STORE_LEADER_TTL_SECONDS,
      })
      transitionTo('leader', selfId)
    } else if (!currentValue) {
      const acquired = await redis.set(REDIS_STORE_LEADER_KEY, selfId, STORE_LEADER_TTL_SECONDS, {
        NX: true,
        EX: STORE_LEADER_TTL_SECONDS,
      })

      if (acquired) {
        transitionTo('leader', selfId)
      } else {
        const winner = await redis.get(REDIS_STORE_LEADER_KEY)
        transitionTo('follower', winner || null)
      }
    } else {
      transitionTo('follower', currentValue)
    }

    consecutiveRedisFailures = 0
  } catch (err) {
    consecutiveRedisFailures += 1
    logger.error(
      { err, consecutiveRedisFailures },
      '[STORE-LEADER] Election tick failed',
    )

    // Below the threshold keep the last known state; past it, degrade to 'unknown'
    // (isLeader() then keeps an ex-leader serving locally, and followers keep
    // best-effort forwarding to the last known leader id).
    if (consecutiveRedisFailures >= MAX_CONSECUTIVE_REDIS_FAILURES && state !== 'unknown') {
      const wasLeader = state === 'leader'
      state = 'unknown'
      logger.warn(
        { leaderId, wasLeader },
        '[STORE-LEADER] Redis unreachable - leadership state unknown',
      )
    }
  }
}

const runTick = (): Promise<void> => {
  if (!tickInFlight) {
    tickInFlight = tick().finally(() => {
      tickInFlight = undefined
    })
  }

  return tickInFlight
}

export const refreshNow = async (): Promise<void> => runTick()

export const start = (leadershipHooks: LeadershipHooks = {}): void => {
  if (ANALYTICS_DB_ENGINE !== 'duckdb' || timer) {
    return
  }

  hooks = leadershipHooks
  state = 'unknown'

  void runTick()

  const jitterMs = Math.floor(Math.random() * (STORE_LEADER_RENEW_INTERVAL_MS / 10))
  timer = setInterval(() => void runTick(), STORE_LEADER_RENEW_INTERVAL_MS + jitterMs)
  timer.unref()
}

export const stop = async (): Promise<void> => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }

  if (state === 'leader') {
    try {
      // Release only our own lease (GET-compare then DEL) so a rolling deploy fails
      // over immediately instead of waiting out the TTL. The compare->delete race is
      // benign for the same reason as renewal.
      const currentValue = await redis.get(REDIS_STORE_LEADER_KEY)

      if (currentValue === selfId) {
        await redis.del(REDIS_STORE_LEADER_KEY)
      }
    } catch (err) {
      logger.error(err, '[STORE-LEADER] Failed to release lease on shutdown')
    }
  }

  transitionTo('idle', null)
  hooks = {}
}

export const waitForLeader = async (timeoutMs = 5000): Promise<string | null> => {
  if (leaderId) {
    return leaderId
  }

  const deadline = Date.now() + timeoutMs

  await runTick()

  while (!leaderId && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, WAIT_FOR_LEADER_POLL_MS))
    await runTick()
  }

  return leaderId
}
