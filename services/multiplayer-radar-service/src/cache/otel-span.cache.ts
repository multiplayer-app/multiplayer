import redis from '@multiplayer/redis'
import { HttpMethod } from '@multiplayer/types'
import {
  REDIS_OTEL_SPAN_CACHE_PREFIX,
  REDIS_OTEL_SPAN_CACHE_TTL,
} from '../config'

const getKey = (
  workspaceId: string,
  projectId: string,
  traceId: string,
  spanId: string,
) => `${REDIS_OTEL_SPAN_CACHE_PREFIX}${workspaceId}:${projectId}:${traceId}:${spanId}`

export const get = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
  spanId: string,
): Promise<{
  serviceName: string,
  httpMethod?: HttpMethod,
  httpEndpoint?: string,
  httpStatus?: string,
} | undefined> => {
  const key = getKey(
    workspaceId,
    projectId,
    traceId,
    spanId,
  )

  const data = await redis.get(key) as any | undefined

  return data as any
}

export const set = async (
  workspaceId: string,
  projectId: string,
  traceId: string,
  spanId: string,
  data: {
    serviceName: string,
    httpMethod?: HttpMethod,
    httpEndpoint?: string,
    httpStatus?: string,
  },
) => {
  const key = getKey(
    workspaceId,
    projectId,
    traceId,
    spanId,
  )

  await redis.set(
    key,
    data,
    REDIS_OTEL_SPAN_CACHE_TTL,
  )
}
