import redis from '@multiplayer/redis'
import NodeCache from 'node-cache'
import {
  REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_PREFIX,
  REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_TTL,
} from '../config'

const getKey = (
  workspaceId: string,
  projectId: string,
  hash: string,
) => `${REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_PREFIX}${workspaceId}:${projectId}:${hash}`

// Every occurrence of a known issue checks the throttle, so a positive answer is kept in process
// for a few seconds. A reset (issue resolved) reaches this replica within that time.
const throttledCache = new NodeCache({ stdTTL: 5 })

export const get = async (
  workspaceId: string,
  projectId: string,
  hash: string,
): Promise<boolean> => {
  const key = getKey(workspaceId, projectId, hash)

  if (throttledCache.get(key)) {
    return true
  }

  const value = await redis.get(key) as unknown as string | undefined

  if (value === '1') {
    throttledCache.set(key, true)
    return true
  }

  return false
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

  throttledCache.del(key)
  await redis.del(key)
}
