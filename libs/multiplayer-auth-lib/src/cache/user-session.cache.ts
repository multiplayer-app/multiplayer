import redis from '@multiplayer/redis'
import { IUserSession } from '@multiplayer/types'
import {
  REDIS_USER_SESSION_PREFIX,
  REDIS_USER_SESSION_TTL,
} from '../config'

const getKey = (userId?: string): string => `${REDIS_USER_SESSION_PREFIX}${userId || '*'}`

export const get = async (userId: string): Promise<IUserSession | undefined> => {
  const key = getKey(userId)

  return redis.get(key)
}

export const set = async (
  userId: string,
  userSession: IUserSession,
): Promise<void> => {
  const key = getKey(userId)

  await redis.set(
    key,
    userSession,
    REDIS_USER_SESSION_TTL,
  )
}

export const del = async (
  userId?: string,
): Promise<void> => {
  const key = getKey(userId)

  return redis.deleteByPattern(key)
}
