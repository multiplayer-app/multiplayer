import redis from '@multiplayer/redis'
import {
  REDIS_ALER_RULES_CACHE_PREFIX,
  REDIS_ALER_RULES_CACHE_TTL,
} from '../config'
import { IAlertRule } from '@multiplayer/types'

const getKey = (projectId: string) => `${REDIS_ALER_RULES_CACHE_PREFIX}${projectId}`

export const get = async (
  projectId: string,
): Promise<IAlertRule[] | undefined> => {
  const alertRules = await redis.get(getKey(projectId))

  return alertRules
}

export const set = async (
  projectId: string,
  payload: IAlertRule[],
): Promise<void> => {
  await redis.set(
    getKey(projectId),
    payload,
    REDIS_ALER_RULES_CACHE_TTL,
  )
}

export const del = async (
  projectId: string,
): Promise<void> => {
  await redis.del(getKey(projectId))
}
