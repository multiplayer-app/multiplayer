import redis from '@multiplayer/redis'
import {
  REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX,
  REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_TTL,
} from '../config'

const getKey = (integrationId: string) => `${REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX}${integrationId}`

export const get = async (integrationId: string): Promise<boolean> => {
  const key = getKey(integrationId)


  const inQueue = await redis.get(key) as string | undefined

  return inQueue === '1' || false
}

export const set = async (
  integrationId: string,
): Promise<void> => {
  const key = getKey(integrationId)

  await redis.set(
    key,
    '1',
    REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_TTL,
  )
}
