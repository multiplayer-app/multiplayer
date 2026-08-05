import redis from '@multiplayer/redis'
import {
  REDIS_OTEL_INTEGRATION_STATUS_PREFIX,
  REDIS_OTEL_INTEGRATION_STATUS_TTL,
} from '../config'

const getKey = (id: string): string => `${REDIS_OTEL_INTEGRATION_STATUS_PREFIX}${id}`

interface IntegrationStatus {
  otelLogs: boolean,
  otelSpans: boolean,
  rrwebEvents: boolean,
}

export const get = async (oauthStateId: string): Promise<IntegrationStatus | undefined> => {
  const key = getKey(oauthStateId)

  return redis.get(key) as any
}

export const set = async (
  integrationId: string,
  payload: IntegrationStatus,
): Promise<void> => {
  const key = getKey(integrationId)

  await redis.set(
    key,
    payload,
    REDIS_OTEL_INTEGRATION_STATUS_TTL,
  )
}

export const remove = async (integrationId: string): Promise<void> => {
  const key = getKey(integrationId)

  await redis.del(key) as any
}
