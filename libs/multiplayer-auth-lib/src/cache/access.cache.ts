import redis from '@multiplayer/redis'
import { IAccess } from '@multiplayer/types'
import {
  REDIS_ACCESS_PREFIX,
  REDIS_ACCESS_PREFIX_TTL,
} from '../config'

const getKey = (id: string) => `${REDIS_ACCESS_PREFIX}${id}`

export const get = async (
  id: string,
): Promise<IAccess | undefined> => {
  const key = getKey(id)

  return (redis.get(key)) as unknown as IAccess | undefined
}

export const set = async (
  id: string,
  access: IAccess,
): Promise<void> => {
  const key = getKey(id)

  await redis.set(
    key,
    access,
    REDIS_ACCESS_PREFIX_TTL,
  )
}
