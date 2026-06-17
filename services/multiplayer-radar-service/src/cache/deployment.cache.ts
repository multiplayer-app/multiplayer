import redis from '@multiplayer/redis'
import {
  REDIS_RELEASE_PREFIX,
  REDIS_RELEASE_TTL,
} from '../config'

const getKey = (
  workspaceId: string,
  projectId: string,
  serviceName: string,
  environmentName: string,
  release: string,
) => `${REDIS_RELEASE_PREFIX}${workspaceId}:${projectId}:${serviceName}:${environmentName}:${release}`

export const get = async (
  workspaceId: string,
  projectId: string,
  serviceName: string,
  environmentName: string,
  release: string,
): Promise<boolean> => {
  const key = getKey(
    workspaceId,
    projectId,
    serviceName,
    environmentName,
    release,
  )

  const cachedReleaseExists = await (redis.get(key)) as unknown as string | undefined

  return cachedReleaseExists === '1'
}

export const set = async (
  workspaceId: string,
  projectId: string,
  serviceName: string,
  environmentName: string,
  release: string,
): Promise<void> => {
  const key = getKey(
    workspaceId,
    projectId,
    serviceName,
    environmentName,
    release,
  )

  await redis.set(
    key,
    '1',
    REDIS_RELEASE_TTL,
  )
}
