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

/**
 * Claims a span for processing. An error span of a session trace arrives on two topics; only the
 * first claim wins, atomically, so it is never processed (and counted) twice.
 * @returns true when this caller claimed the span
 */
export const claim = async (
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

  if (spanIdCache.get(key)) {
    return false
  }

  spanIdCache.set(key, true)

  return redis.lockKey(key, REDIS_OTEL_SPAN_ID_CACHE_TTL)
}
