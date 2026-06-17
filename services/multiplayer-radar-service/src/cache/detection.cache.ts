import NodeCache from 'node-cache'
import redis from '@multiplayer/redis'
import {
  REDIS_DETECTIONS_CACHE_TTL,
  REDIS_DETECTIONS_CACHE_PREFIX,
} from '../config'

const detectionIdCache = new NodeCache({ stdTTL: 10 })

const getKey = (detectionId: string) => `${REDIS_DETECTIONS_CACHE_PREFIX}${detectionId}`

export const mget = async (detectionIds: string[]): Promise<{ [detectionId: string]: boolean }> => {
  let cacheMapping: { [detectionId: string]: boolean } = {}
  const keys = detectionIds.map(getKey)

  const cachedDetectionIds = detectionIdCache.mget(keys) as { [key: string]: string }

  if (cachedDetectionIds) {
    for (const _detectionId in cachedDetectionIds) {
      cacheMapping[_detectionId] = cachedDetectionIds[_detectionId] === '1'
    }
  }

  if (detectionIds.length > 0 && Object.keys(cachedDetectionIds).length !== detectionIds.length) {
    const notCachedIds = detectionIds.filter(_detectionId => !cachedDetectionIds[_detectionId])

    const redisCachedDetectionIds = await redis.mget(notCachedIds)

    const redisCachedMapping = notCachedIds.reduce((acc, detectionId, index) => {
      acc[detectionId] = redisCachedDetectionIds[index] === '1'

      return acc
    }, {})

    cacheMapping = {
      ...cacheMapping,
      ...redisCachedMapping,
    }
  }

  return cacheMapping
}

export const mset = async (
  detectionIds: string[],
): Promise<void> => {
  await redis.mset(
    detectionIds.map(detectionId => ({
      key: getKey(detectionId),
      value: '1',
    })),
    REDIS_DETECTIONS_CACHE_TTL,
  )

  detectionIdCache.mset(detectionIds.map(detectionId => ({
    key: getKey(detectionId),
    val: '1',
  })))
}
