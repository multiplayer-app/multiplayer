import redis from '@multiplayer/redis'
import {
  REDIS_CONTINUOUS_DEBUG_SESSION_PREFIX,
  // REDIS_CONTINUOUS_DEBUG_SESSION_TTL,
} from '../config'
import { IContinuousDebugSession } from '../types'

const getKey = (shortId: string) => `${REDIS_CONTINUOUS_DEBUG_SESSION_PREFIX}:${shortId}`

export const get = async (
  shortId: string,
): Promise<IContinuousDebugSession | undefined> => {
  const continuousDebugSession = await redis.get(getKey(shortId))

  return continuousDebugSession
}

export const set = async (
  shortId: string,
  payload: IContinuousDebugSession,
): Promise<void> => {
  await redis.set(
    getKey(shortId),
    payload,
    // REDIS_CONTINUOUS_DEBUG_SESSION_TTL,
  )
}

export const del = async (
  shortId: string,
): Promise<void> => {
  await redis.del(getKey(shortId))
}
