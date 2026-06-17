import redis from '@multiplayer/redis'
import { IIntegration } from '@multiplayer/types'
import {
  REDIS_USER_KEY_PREFIX,
  REDIS_USER_TTL,
} from '../config'

const getKey = (
  userId: string,
) => `${REDIS_USER_KEY_PREFIX}${userId}`

export const get = async (integrationId: string): Promise<IIntegration | undefined> => {
  const key = getKey(integrationId)

  return (redis.get(key)) as unknown as IIntegration | undefined
}

export const set = async (
  integrationId: string,
  integration: IIntegration,
): Promise<void> => {
  const key = getKey(integrationId)

  await redis.set(
    key,
    integration,
    REDIS_USER_TTL,
  )
}
