import redis from '@multiplayer/redis'
import NodeCache from 'node-cache'
import {
  REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX,
  DEBUG_SESSION_MAX_DURATION_SECONDS,
} from '../config'

const debugSessionShortIdCache = new NodeCache({ stdTTL: 15 })

const getKey = (debugSessionShortId: string) => `${REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX}${debugSessionShortId}`

export const get = async (debugSessionShortId: string): Promise<string | undefined> => {
  const key = getKey(debugSessionShortId)

  let debugSessionLongId = debugSessionShortIdCache.get(key) as string | undefined

  if (!debugSessionLongId) {
    debugSessionLongId = await redis.get(key) as string | undefined
  }

  return debugSessionLongId
}

export const set = async (
  debugSessionShortId: string,
  debugSessionLongId: string,
  ttl?: number,
): Promise<void> => {
  const key = getKey(debugSessionShortId)

  debugSessionShortIdCache.set(
    key,
    debugSessionLongId,
    15,
  )

  await redis.set(
    key,
    debugSessionLongId,
    ttl || DEBUG_SESSION_MAX_DURATION_SECONDS,
  )
}

export const unset = async (debugSessionShortId: string): Promise<void> => {
  const key = getKey(debugSessionShortId)

  await redis.del(key)

  debugSessionShortIdCache.del(key)
}
