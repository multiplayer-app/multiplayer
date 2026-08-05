import redis from '@multiplayer/redis'
import {
  REDIS_BLOCKED_USER_PREFIX,
  REDIS_BLOCKED_USER_TTL,
} from '../config'

const getKey = (userId: string): string => `${REDIS_BLOCKED_USER_PREFIX}${userId}`

export const get = async (userId: string): Promise<boolean> => {
  const key = getKey(userId)

  const isBlocked = (await redis.get(key)) === '1'

  return isBlocked
}

export const set = async (userId: string): Promise<void> => {
  const key = getKey(userId)

  await redis.set(
    key,
    '1',
    REDIS_BLOCKED_USER_TTL,
  )
}
