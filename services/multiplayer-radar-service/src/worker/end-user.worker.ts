import redis from '@multiplayer/redis'
import logger from '@multiplayer/logger'
import { EndUserModel } from '@multiplayer/models'
import { REDIS_SOCKET_LOCK_KEY_PREFIX } from '../config'
import {
  EndUserService,
  DebugSessionService,
} from '../services'
import { endUserNamespaceHandler } from '../websocket'

export const clearStuckSocketConnections = async () => {
  try {
    const locked = await redis.lockKey(REDIS_SOCKET_LOCK_KEY_PREFIX)

    if (!locked) {
      return
    }

    for await (const endUser of EndUserModel.getEndUsersWithConnectionsCursor()) {
      if (endUser.connections.length === 0) {
        continue
      }

      for (const connection of endUser.connections) {
        if (!endUserNamespaceHandler.isSocketConnected(connection.socketId)) {
          logger.debug({
            socketId: connection.socketId,
            endUserId: endUser._id.toString(),
          }, '[SOCKET_CHECK] Removing stuck socket connection')
          await EndUserService.removeConnection(connection.socketId)
          await DebugSessionService.removeSocketIdFromDebugSession(connection.socketId)
        }
      }
    }

  } catch (error) {
    logger.error(error, '[SOCKET_CHECK] Failed to process expired debug session')
  } finally {
    await redis.del(REDIS_SOCKET_LOCK_KEY_PREFIX)
  }
}
