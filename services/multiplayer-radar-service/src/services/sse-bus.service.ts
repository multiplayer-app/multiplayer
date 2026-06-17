import { EventEmitter } from 'events'
import { createClient, type RedisClient } from '@multiplayer/redis'
import logger from '@multiplayer/logger'

export interface SseBusEvent {
  event: string
  data: unknown
}

const SSE_CHANNEL_PREFIX = 'sse:bus:'
const getChannel = (sessionId: string) => `${SSE_CHANNEL_PREFIX}${sessionId}`

/**
 * SSE Bus backed by Redis Pub/Sub so that events are distributed across
 * all server instances, not just the process that published them.
 *
 * Initializes lazily on first publish/subscribe call.
 * Falls back to local-only EventEmitter if Redis is unavailable.
 */
class SseBusService extends EventEmitter {
  private pubClient: RedisClient | null = null
  private subClient: RedisClient | null = null
  private redisReady = false
  private initPromise: Promise<void> | null = null
  private subscribedChannels = new Map<string, number>()

  private ensureInitialized(): void {
    if (this.initPromise) return
    this.initPromise = this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      this.pubClient = createClient()
      this.subClient = createClient()

      await this.pubClient.connect()
      await this.subClient.connect()

      this.redisReady = true
      logger.info('[SSE_BUS] Redis Pub/Sub initialized')
    } catch (error) {
      logger.error(error, '[SSE_BUS] Failed to initialize Redis Pub/Sub, falling back to local-only')
      this.pubClient = null
      this.subClient = null
      this.redisReady = false
    }
  }

  publish(sessionId: string, event: string, data: unknown) {
    const payload: SseBusEvent = { event, data }

    this.ensureInitialized()

    // Always emit locally for same-process subscribers
    this.emit(sessionId, payload)

    // Publish to Redis for cross-process delivery
    if (this.redisReady && this.pubClient) {
      const channel = getChannel(sessionId)
      this.pubClient.publish(channel, JSON.stringify(payload)).catch((err) => {
        logger.error(err, `[SSE_BUS] Failed to publish to Redis channel ${channel}`)
      })
    }
  }

  subscribe(sessionId: string, callback: (payload: SseBusEvent) => void): () => void {
    this.ensureInitialized()

    // Local listener for same-process events
    this.on(sessionId, callback)

    // Redis subscription for cross-process events
    const channel = getChannel(sessionId)
    const redisCallback = (message: string) => {
      try {
        const payload = JSON.parse(message) as SseBusEvent
        callback(payload)
      } catch (err) {
        logger.error(err, `[SSE_BUS] Failed to parse Redis message on channel ${channel}`)
      }
    }

    if (this.redisReady && this.subClient) {
      const refCount = this.subscribedChannels.get(channel) ?? 0
      this.subscribedChannels.set(channel, refCount + 1)

      if (refCount === 0) {
        this.subClient.subscribe(channel, redisCallback).catch((err) => {
          logger.error(err, `[SSE_BUS] Failed to subscribe to Redis channel ${channel}`)
        })
      }
    }

    return () => {
      this.off(sessionId, callback)

      if (this.redisReady && this.subClient) {
        const count = (this.subscribedChannels.get(channel) ?? 1) - 1
        if (count <= 0) {
          this.subscribedChannels.delete(channel)
          this.subClient.unsubscribe(channel).catch((err) => {
            logger.error(err, `[SSE_BUS] Failed to unsubscribe from Redis channel ${channel}`)
          })
        } else {
          this.subscribedChannels.set(channel, count)
        }
      }
    }
  }
}

export const sseBus = new SseBusService()
sseBus.setMaxListeners(0)
