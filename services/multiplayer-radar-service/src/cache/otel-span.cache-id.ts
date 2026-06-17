import redis from '@multiplayer/redis'
import NodeCache from 'node-cache'
import {
  REDIS_OTEL_SPAN_ID_CACHE_PREFIX,
  REDIS_OTEL_SPAN_ID_CACHE_TTL,
} from '../config'

const getKey = (
  workspaceId: string,
  projectId: string,
  traceId: string,
  spanId: string,
) => `${REDIS_OTEL_SPAN_ID_CACHE_PREFIX}${workspaceId}:${projectId}:${traceId}:${spanId}`

const spanIdCache = new NodeCache({ stdTTL: 5 })

export const get = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
  spanId: string,
): Promise<boolean> => {
  const key = getKey(
    workspaceId,
    projectId,
    traceId,
    spanId,
  )

  let data = spanIdCache.get(key) as string | undefined

  if (data === '1') {
    return true
  }

  data = await redis.get(key) as any | undefined

  return data === '1'
}

export const set = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
  spanId: string,
) => {
  const key = getKey(
    workspaceId,
    projectId,
    traceId,
    spanId,
  )

  spanIdCache.set(
    key,
    '1',
  )

  await redis.set(
    key,
    '1',
    REDIS_OTEL_SPAN_ID_CACHE_TTL,
  )
}
