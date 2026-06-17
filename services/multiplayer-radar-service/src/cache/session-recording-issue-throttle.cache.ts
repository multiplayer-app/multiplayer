import redis from '@multiplayer/redis'
import {
  REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_PREFIX,
  REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_TTL,
} from '../config'

const getKey = (
  workspaceId: string,
  projectId: string,
  hash: string,
) => `${REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_PREFIX}${workspaceId}:${projectId}:${hash}`

export const get = async (
  workspaceId: string,
  projectId: string,
  hash: string,
): Promise<boolean> => {
  const key = getKey(workspaceId, projectId, hash)

  const value = await redis.get(key) as unknown as string | undefined

  return value === '1'
}

export const set = async (
  workspaceId: string,
  projectId: string,
  hash: string,
): Promise<void> => {
  const key = getKey(workspaceId, projectId, hash)

  await redis.set(
    key,
    '1',
    REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_TTL,
  )
}

export const del = async (
  workspaceId: string,
  projectId: string,
  hash: string,
): Promise<void> => {
  const key = getKey(workspaceId, projectId, hash)

  await redis.del(key)
}
