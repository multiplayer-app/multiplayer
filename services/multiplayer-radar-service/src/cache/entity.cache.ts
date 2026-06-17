import redis from '@multiplayer/redis'
import NodeCache from 'node-cache'
import { EntityType } from '@multiplayer/types'
import {
  REDIS_ENTITY_CACHE_PREFIX,
  REDIS_ENTITY_TTL,
} from '../config'

const entityCache = new NodeCache({ stdTTL: 15 })

const getKey = (
  workspaceId: string,
  projectId: string,
  entityType: EntityType,
  entityName: string,
) => `${REDIS_ENTITY_CACHE_PREFIX}${workspaceId}:${projectId}:${entityType}:${entityName}`

export const get = async (
  workspaceId: string,
  projectId: string,
  entityType: EntityType,
  entityName: string,
): Promise<string | undefined> => {
  const key = getKey(
    workspaceId,
    projectId,
    entityType,
    entityName,
  )

  let entityId = entityCache.get(key) as string | undefined

  if (!entityId) {
    entityId = await redis.get(key) as string | undefined
  }

  return entityId
}

export const set = async (
  workspaceId: string,
  projectId: string,
  entityType: EntityType,
  entityId: string,
  entityName: string,
): Promise<void> => {
  const key = getKey(
    workspaceId,
    projectId,
    entityType,
    entityName,
  )

  entityCache.set(
    key,
    entityId,
  )

  await redis.set(
    key,
    entityId,
    REDIS_ENTITY_TTL,
  )
}
