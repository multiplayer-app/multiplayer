import { DebugSessionModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { MoveDebugSessionDataToS3Message } from '@multiplayer/types'
import redis from '@multiplayer/redis'
import {
  REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX,
  REDIS_DEBUG_SESSION_LOCK_PREFIX,
} from '../config'
import {
  DebugSessionService,
  ContinuousDebugSessionService,
} from '../services'

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
