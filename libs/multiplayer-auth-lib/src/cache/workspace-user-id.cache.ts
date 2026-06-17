import redis from '@multiplayer/redis'
import {
  REDIS_WORKSPACE_USER_ID_KEY_PREFIX,
  REDIS_WORKSPACE_USER_ID_TTL,
} from '../config'

const getKey = (
  userId: string,
  workspaceId: string,
) => `${REDIS_WORKSPACE_USER_ID_KEY_PREFIX}${userId}:${workspaceId}`

export const get = async (userId: string, workspaceId: string): Promise<string | undefined> => {
  const key = getKey(userId, workspaceId)

  return (redis.get(key)) as unknown as string | undefined
}

export const set = async (
  userId: string,
  workspaceId: string,
  workspaceUserId: string,
): Promise<void> => {
  const key = getKey(userId, workspaceId)

  await redis.set(
    key,
    workspaceUserId,
    REDIS_WORKSPACE_USER_ID_TTL,
  )
}
