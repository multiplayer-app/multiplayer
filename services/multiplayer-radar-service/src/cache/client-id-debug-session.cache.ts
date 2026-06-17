import redis from '@multiplayer/redis'
import {
  REDIS_CLIENT_ID_DEBUG_SESSION_PREFIX,
  REDIS_CLIENT_ID_DEBUG_SESSION_TTL,
} from '../config'

const getKey = (
  workspaceId: string,
  projectId: string,
  clientId: string,
) => `${REDIS_CLIENT_ID_DEBUG_SESSION_PREFIX}${workspaceId}:${projectId}:${clientId}`

export const get = async (
  workspaceId: string,
  projectId: string,
  clientId: string,
): Promise<string | undefined> => {
  const key = getKey(
    workspaceId,
    projectId,
    clientId,
  )

  const debugSessionId = await redis.get(key) as string | undefined

  return debugSessionId
}

export const set = async (
  workspaceId: string,
  projectId: string,
  clientId: string,
  debugSessionId: string,
): Promise<void> => {
  const key = getKey(
    workspaceId,
    projectId,
    clientId,
  )

  await redis.set(
    key,
    debugSessionId,
    REDIS_CLIENT_ID_DEBUG_SESSION_TTL,
  )
}
