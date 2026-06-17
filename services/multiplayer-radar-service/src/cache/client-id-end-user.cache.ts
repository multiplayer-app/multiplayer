import NodeCache from 'node-cache'
import { IEndUser } from '@multiplayer/types'
import {
  REDIS_CLIENT_ID_END_USER_PREFIX,
  REDIS_CLIENT_ID_END_USER_TTL,
} from '../config'

const clientIdEndUserCache = new NodeCache({ stdTTL: 15 })

const getKey = (
  clientId: string,
) => `${REDIS_CLIENT_ID_END_USER_PREFIX}${clientId}`

export const get = async (
  clientId: string,
): Promise<IEndUser | undefined> => {
  const key = getKey(
    clientId,
  )

  const endUser = clientIdEndUserCache.get(key) as IEndUser | undefined

  return endUser
}

export const set = async (
  clientId: string,
  endUser: IEndUser,
): Promise<void> => {
  const key = getKey(
    clientId,
  )

  clientIdEndUserCache.set(
    key,
    endUser,
    REDIS_CLIENT_ID_END_USER_TTL,
  )
}
