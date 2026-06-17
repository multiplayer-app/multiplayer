import redis from '@multiplayer/redis'
import {
  REDIS_CLIENT_ID_SOCKET_PREFIX,
  REDIS_CLIENT_ID_SOCKET_TTL,
} from '../config'

const getKey = (clientId: string) => `${REDIS_CLIENT_ID_SOCKET_PREFIX}${clientId}`

export const get = async (clientId: string): Promise<string | undefined> => {
  const key = getKey(clientId)

  const debugSessionId = await redis.get(key) as string | undefined

  return debugSessionId
}

export const set = async (
  clientId: string,
  socketId: string,
): Promise<void> => {
  const key = getKey(clientId)

  await redis.set(
    key,
    socketId,
    REDIS_CLIENT_ID_SOCKET_TTL,
  )
}

export const remove = async (clientId: string): Promise<void> => {
  const key = getKey(clientId)

  await redis.del(key)
}
