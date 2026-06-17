import redis from '@multiplayer/redis'
import {
  REDIS_RELEASE_PREFIX,
  REDIS_RELEASE_TTL,
} from '../config'

const getKey = (
  workspaceId: string,
  projectId: string,
  serviceName: string,
  release: string,
) => `${REDIS_RELEASE_PREFIX}${workspaceId}:${projectId}:${serviceName}:${release}`

export const get = async (
  workspaceId: string,
  projectId: string,
  serviceName: string,
  release: string,
): Promise<string | undefined> => {
  const key = getKey(workspaceId, projectId, serviceName, release)

  return (redis.get(key)) as unknown as string | undefined
}

export const set = async (
  workspaceId: string,
  projectId: string,
  serviceName: string,
  release: string,
  releaseId: string,
): Promise<void> => {
  const key = getKey(workspaceId, projectId, serviceName, release)

  await redis.set(
    key,
    releaseId,
    REDIS_RELEASE_TTL,
  )
}
