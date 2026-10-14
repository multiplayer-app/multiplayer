import { DebugSessionModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { MoveDebugSessionDataToS3Message } from '@multiplayer/types'
import redis from '@multiplayer/redis'
import {
  REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX,
  REDIS_DEBUG_SESSION_LOCK_PREFIX,
  ANALYTICS_DB_ENGINE,
  SHUTDOWN_S3_CHECKPOINT_TIMEOUT_MS,
  SHUTDOWN_S3_CHECKPOINT_CONCURRENCY,
} from '../config'
import {
  DebugSessionService,
  ContinuousDebugSessionService,
} from '../services'
import * as StoreLeaderElection from '../store/leader-election'

export const stopDebugSession = async (key: string) => {
  if (!key.startsWith(REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX)) {
    return
  }

  const debugSessionShortId = key.replace(REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX, '')

  const lockKey = `${REDIS_DEBUG_SESSION_LOCK_PREFIX}${debugSessionShortId}`

  try {
    const locked = await redis.lockKey(lockKey)

    if (!locked) {
      return
    }

    logger.info({ debugSessionShortId }, '[DEBUG-SESSION-WORKER] Stopping debug session')

    const debugSessionId = await DebugSessionModel.getNotTransferedDebugSessionIdByShortId(
      debugSessionShortId,
    )

    if (!debugSessionId) {
      logger.error({
        debugSessionShortId,
        debugSessionId,
      }, '[DEBUG-SESSION-WORKER] Active session not found')
      return
    }

    await DebugSessionService.stopDebugSessionById(
      debugSessionId,
      undefined,
      true,
    )
  } catch (error) {
    logger.error(error, { key }, '[DEBUG-SESSION] Failed to process expired debug session')
  } finally {
    await redis.del(lockKey)
  }
}

export const moveDebugSessionDataFromChToS3 = async (message: {
  variables: MoveDebugSessionDataToS3Message
}) => {
  const debugSession = await DebugSessionModel.findDebugSessionById(
    message.variables.debugSessionId,
  )

  if (!debugSession) {
    logger.error({
      debugSessionId: message.variables.debugSessionId,
    }, '[DEBUG-SESSION-WORKER] session not found')
    return
  }

  if (debugSession.continuousDebugSession) {
    await ContinuousDebugSessionService.moveContinuousDebugSessionDataFromChToS3(
      message.variables.debugSessionId,
    )
  } else {
    await DebugSessionService.moveDebugSessionDataFromChToS3(
      message.variables.debugSessionId,
    )
  }
}

export const stopStuckDebugSessions = async () => {
  for await (const debugSession of DebugSessionModel.getStuckNotStoppedDebugSessionsCursor()) {
    logger.info({
      debugSessionShortId: debugSession.shortId,
      debugSessionId: debugSession._id.toString(),
    }, '[DEBUG-SESSION-WORKER] Stopping stuck debug session')
    await stopDebugSession(`${REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX}${debugSession.shortId}`)
  }
}

// DuckDB's local file is the only copy of a not-yet-transferred session's data - unlike
// ClickHouse (a shared external store), a redeploy/scale-down of this replica would
// otherwise lose it. Called from the exit handler while this replica still holds
// leadership (or is running single-replica), before the store connection is torn down.
// Reuses moveDebugSessionDataFromChToS3/moveContinuousDebugSessionDataFromChToS3
// unchanged as a mid-flight checkpoint - they only mark finishedS3Transfer once the
// session has actually stopped, so a still-active session gets a safety copy in S3
// without being treated as done; the real, final move still happens normally later.
export const checkpointActiveDebugSessionsToS3 = async (): Promise<void> => {
  if (
    ANALYTICS_DB_ENGINE !== 'duckdb'
    || !(StoreLeaderElection.isLeader() || StoreLeaderElection.getState() === 'idle')
  ) {
    return
  }

  logger.info('[DEBUG-SESSION-WORKER] Checkpointing not-yet-transferred debug session data to S3 before shutdown')

  const deadline = Date.now() + SHUTDOWN_S3_CHECKPOINT_TIMEOUT_MS
  let total = 0
  let failed = 0

  // A single sequential reader pulls sessions off the cursor - Mongoose/Node stream
  // cursors aren't safe to read from multiple concurrent `for await` loops at once
  // (verified: doing so redelivered the same document to more than one loop instead
  // of splitting the stream). Bounded concurrency instead comes from capping how many
  // moveDebugSessionDataFromChToS3 calls run at once, matching the S3-move AMQP
  // queue's own concurrency (prefetch: 3) - avoids overwhelming DuckDB/S3 while still
  // making real progress within the shutdown window.
  const inFlight = new Set<Promise<void>>()

  for await (const debugSession of DebugSessionModel.getNotTransferredDebugSessionsCursor()) {
    if (Date.now() >= deadline) {
      break
    }

    total += 1

    const task = (async () => {
      try {
        if (debugSession.continuousDebugSession) {
          await ContinuousDebugSessionService.moveContinuousDebugSessionDataFromChToS3(
            debugSession._id.toString(),
          )
        } else {
          await DebugSessionService.moveDebugSessionDataFromChToS3(
            debugSession._id.toString(),
          )
        }
      } catch (error) {
        failed += 1
        logger.error(error, {
          debugSessionId: debugSession._id.toString(),
        }, '[DEBUG-SESSION-WORKER] Failed to checkpoint debug session data to S3')
      }
    })()

    inFlight.add(task)
    task.finally(() => inFlight.delete(task))

    if (inFlight.size >= SHUTDOWN_S3_CHECKPOINT_CONCURRENCY) {
      await Promise.race(inFlight)
    }
  }

  await Promise.all(inFlight)

  logger.info({ total, failed }, '[DEBUG-SESSION-WORKER] Finished checkpointing debug session data to S3')
}
