import redis from '@multiplayer/redis'
import type { Context } from '../access-control/types/context'
import {
  ACCESS_CONTEXT_KEY_PREFIX,
  ACCESS_CONTEXT_TTL,
} from '../config'

const getKey = ({ userId, workspaceId }: {
  userId?: string,
  workspaceId?: string
}): string => `${ACCESS_CONTEXT_KEY_PREFIX}:${workspaceId || '*'}:${userId || '*'}`

export const get = async ({ userId, workspaceId }: {
  userId?: string,
  workspaceId?: string
}): Promise<Context | undefined> => {
  const key = getKey({ userId, workspaceId })

  return redis.get(key)
}

export const set = async (
  { userId, workspaceId }: {
    userId?: string,
    workspaceId?: string
  },
  context: Context,
): Promise<void> => {
  const key = getKey({ userId, workspaceId })

  await redis.set(
    key,
    context,
    ACCESS_CONTEXT_TTL,
  )
}

export const del = async ({
  userId,
  workspaceId,
}: {
  userId?: string,
  workspaceId?: string
}): Promise<void> => {
  const key = getKey({
    userId,
    workspaceId,
  })

  return redis.deleteByPattern(key)
}
