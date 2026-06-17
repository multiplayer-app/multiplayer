import redis from '@multiplayer/redis'
import {
  REDIS_PROJECT_PREFIX,
  REDIS_PROJECT_TTL,
} from '../config'
import { IProject } from '@multiplayer/types'

const getKey = (projectId: string) => `${REDIS_PROJECT_PREFIX}:${projectId}`

export const get = async (
  projectId: string,
): Promise<IProject | undefined> => {
  const issuesSettings = await redis.get(getKey(projectId))

  return issuesSettings
}

export const set = async (
  projectId: string,
  payload: IProject,
): Promise<void> => {
  await redis.set(
    getKey(projectId),
    payload,
    REDIS_PROJECT_TTL,
  )
}

export const del = async (
  projectId: string,
): Promise<void> => {
  await redis.del(getKey(projectId))
}
