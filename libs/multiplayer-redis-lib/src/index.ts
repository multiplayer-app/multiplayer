import * as redis from 'redis'
import type { RedisClientType, SetOptions } from 'redis'
import logger from '@multiplayer/logger'
import {
  REDIS_URI as _REDIS_URI,
  REDIS_DB,
  isLocalEnv,
} from './config'

export const REDIS_URI = _REDIS_URI

const REDIS_URI_MASKED = REDIS_URI?.replace(/:\/\/(.*):(.*)@/, '://***:***@')

export type RedisClient = RedisClientType<any, any, any>

export let client: RedisClient
let clientForSubscriptions: RedisClient

export const createClient = (redisUri?: string): RedisClient => {
  const _client = redis.createClient({
    url: redisUri || REDIS_URI,
  })
    .on(
      'error',
      err => logger.error(err, '[REDIS] Redis Client Error'),
    )

  return _client
}

export const connect = async () => {
  try {
    if (!client) {
      client = createClient()
    }

    if (!client.isReady && !client.isOpen) {
      logger.info(`[REDIS] Trying to connect ${REDIS_URI_MASKED}`)
      await client.connect()

      logger.info(`[REDIS] Connected to ${REDIS_URI_MASKED}`)
    }

    return client
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export const disconnect = async () => {
  if (client) {
    await client.disconnect()
    logger.info(`[REDIS] Disconnected from ${REDIS_URI_MASKED}`)
  }
}

export const get = async (key: string) => {
  try {
    const value = await client.get(key)

    if (
      value?.startsWith('{')
      || value?.startsWith('[')
    ) {
      try {
        return JSON.parse(value)
      } catch (e) {
        return value
      }
    } else {
      return value
    }
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export const set = async (
  key: string,
  value: any,
  expireInSeconds?: number,
  customOptions?: SetOptions,
) => {
  try {
    const _value = typeof value === 'object'
      ? JSON.stringify(value)
      : value

    const options: SetOptions = customOptions || {}

    if (expireInSeconds) {
      options.EX = expireInSeconds
    }

    return client.set(
      key,
      _value,
      options,
    )
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export const del = async (key: string | string[]) => {
  await client.del(key)
}

export const deleteByPattern = async (keyPattern: string) => {
  try {
    for await (const key of client.scanIterator({
      TYPE: 'string',
      MATCH: keyPattern,
      COUNT: 100,
    })) {
      logger.debug({ key }, '[REDIS] Unlinking key')
      await client.unlink(key)
    }
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export const mget = async (keys: string[]) => {
  try {
    const values = await client.mGet(keys)

    return values.map(value => {
      if (value?.startsWith('{')) {
        try {
          return JSON.parse(value)
        } catch (e) {
          return value
        }
      } else {
        return value
      }
    })
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export const ping = async (clientToPing?: RedisClient) => {
  const clientToCheck = clientToPing || client

  if (!clientToCheck || !clientToCheck.isReady) {
    return false
  }
  try {
    const res = await clientToCheck.ping()
    return res.toLowerCase() === 'pong'
  } catch (err) {
    return false
  }
}

export const mset = async (
  payload: { key: string, value: any }[],
  expireInSeconds?: number,
) => {
  try {
    const data: string[] = []

    for (let i = 0; i < payload.length; i++) {
      const _value = typeof payload[i].value === 'object'
        ? JSON.stringify(payload[i].value)
        : payload[i].value

      data.push(payload[i].key, _value)
    }

    await client.mSet(data)

    if (expireInSeconds) {
      await Promise.all(
        payload
          .map(({ key }) => client.expire(key, expireInSeconds)),
      )
    }
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export const subscribeOnExpire = async (fn) => {
  try {
    if (!clientForSubscriptions) {
      clientForSubscriptions = createClient()
      await clientForSubscriptions.connect()
      if (isLocalEnv) {
        await clientForSubscriptions.sendCommand(['config', 'set', 'notify-keyspace-events', 'Ex'])
      }
    }

    await clientForSubscriptions.subscribe(`__keyevent@${REDIS_DB}__:expired`, fn)
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export const lockKey = async (
  key: string,
  expireInSeconds = 10,
): Promise<boolean> => {
  try {
    const options: SetOptions = {
      NX: true,
      EX: expireInSeconds,
    }

    const lockAcquired = await client.set(key, '1', options)

    if (lockAcquired) {
      return true
    }

    return false
  } catch (error: any) {
    if (!error.stack) {
      throw new Error(error)
    }

    throw error
  }
}

export default {
  connect,
  disconnect,
  createClient,
  get,
  set,
  del,
  deleteByPattern,
  mset,
  mget,
  subscribeOnExpire,
  ping,
  lockKey,
}
