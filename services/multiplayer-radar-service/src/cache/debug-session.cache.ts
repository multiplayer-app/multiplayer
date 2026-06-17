import redis from '@multiplayer/redis'
import NodeCache from 'node-cache'
import { IDebugSession } from '@multiplayer/types'
import {
  REDIS_DEBUG_SESSION_CACHE_PREFIX,
  REDIS_DEBUG_SESSION_TTL,
} from '../config'

const debugSessionCache = new NodeCache({ stdTTL: 15 })

const getKey = (debugSessionId: string) => `${REDIS_DEBUG_SESSION_CACHE_PREFIX}${debugSessionId}`

export const get = async (debugSessionId: string): Promise<IDebugSession | undefined> => {
  const key = getKey(debugSessionId)

  let debugSession = debugSessionCache.get(key) as IDebugSession | undefined

  if (!debugSession) {
    debugSession = await redis.get(key) as IDebugSession | undefined
  }

  return debugSession
}

export const set = async (
  debugSessionId: string,
  debugSession: IDebugSession,
): Promise<void> => {
  const key = getKey(debugSessionId)

  debugSessionCache.set(
    key,
    debugSession,
  )

  await redis.set(
    key,
    debugSession,
    REDIS_DEBUG_SESSION_TTL,
  )
}

export const unset = async (debugSessionId: string): Promise<void> => {
  const key = getKey(debugSessionId)

  debugSessionCache.del(key)
  await redis.del(key)
}
