import redis from '@multiplayer/redis'
import { IUser } from '@multiplayer/types'
import {
  REDIS_USER_KEY_PREFIX,
  REDIS_USER_TTL,
} from '../config'

const getKey = (
  userId: string,
) => `${REDIS_USER_KEY_PREFIX}${userId}`

export const get = async (userId: string): Promise<IUser | undefined> => {
  const key = getKey(userId)

  return (redis.get(key)) as unknown as IUser | undefined
}

export const set = async (
  userId: string,
  user: IUser,
): Promise<void> => {
  const key = getKey(userId)

  await redis.set(
    key,
    user,
    REDIS_USER_TTL,
  )
}
