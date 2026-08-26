import redis from '@multiplayer/redis'
import {
  REDIS_USER_LOGIN_ATTEMPTS_PREFIX,
  REDIS_USER_LOGIN_ATTEMPTS_TTL,
} from '../config'

const getKey = (userId: string): string => `${REDIS_USER_LOGIN_ATTEMPTS_PREFIX}${userId}`

export const get = async (userId: string): Promise<number> => {
  const key = getKey(userId)

  const cachedAttempts = await redis.get(key)

  return Number(cachedAttempts || 0)
}

export const increment = async (userId: string): Promise<number> => {
  const key = getKey(userId)

  let cachedAttempts = await get(userId)

  let sendTtl = true

  if (cachedAttempts > 0) {
    sendTtl = false
  }

  cachedAttempts++

  await redis.set(
    key,
    cachedAttempts,
    sendTtl ? REDIS_USER_LOGIN_ATTEMPTS_TTL : undefined,
    {
      KEEPTTL: true,
    },
  )

  return cachedAttempts
}

export const remove = async (userId: string): Promise<void> => {
  const key = getKey(userId)

  await redis.del(key) as any
}
