import redis from '@multiplayer/redis'
import { ICachedFlow } from '../types'
import {
  REDIS_OTEL_FLOW_DATA_CACHE_PREFIX,
  REDIS_OTEL_FLOW_KEY_CACHE_PREFIX,
  REDIS_OTEL_FLOW_KEY_CACHE_TTL,
} from '../config'

export const get = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
): Promise<ICachedFlow | undefined> => {
  const dataKey = `${REDIS_OTEL_FLOW_DATA_CACHE_PREFIX}${workspaceId}:${projectId}:${traceId}`

  const flow = await redis.get(dataKey) as ICachedFlow | undefined

  return flow
}

export const set = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
  data: Omit<ICachedFlow, 'id'>,
): Promise<void> => {
  const dataKey = `${REDIS_OTEL_FLOW_DATA_CACHE_PREFIX}${workspaceId}:${projectId}:${traceId}`
  const cacheKey = `${REDIS_OTEL_FLOW_KEY_CACHE_PREFIX}${workspaceId}:${projectId}:${traceId}`

  await Promise.all([
    redis.set(
      dataKey,
      data,
      REDIS_OTEL_FLOW_KEY_CACHE_TTL * 3,
    ),
    redis.set(
      cacheKey,
      1,
      REDIS_OTEL_FLOW_KEY_CACHE_TTL,
    ),
  ])
}

export const unset = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
): Promise<void> => {
  const dataKey = `${REDIS_OTEL_FLOW_DATA_CACHE_PREFIX}${workspaceId}:${projectId}:${traceId}`
  const cacheKey = `${REDIS_OTEL_FLOW_KEY_CACHE_PREFIX}${workspaceId}:${projectId}:${traceId}`

  await Promise.all([
    redis.del(dataKey),
    redis.del(cacheKey),
  ])
}
