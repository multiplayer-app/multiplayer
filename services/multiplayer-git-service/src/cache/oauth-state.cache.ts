import * as crypto from 'crypto'
import redis from '@multiplayer/redis'
import { OAuthState } from '@multiplayer/types'
import {
  REDIS_OAUTH_STATE_PREFIX,
  REDIS_OAUTH_STATE_TTL,
} from '../config'

const getKey = (id: string): string => `${REDIS_OAUTH_STATE_PREFIX}${id}`

export const get = async (oauthStateId: string): Promise<OAuthState | undefined> => {
  const key = getKey(oauthStateId)

  return redis.get(key) as any
}

export const set = async (payload: Omit<OAuthState, '_id' | 'code_verifier'>): Promise<OAuthState> => {
  const oauthStateId = crypto.randomUUID()
  const key = getKey(oauthStateId)
  const codeVerifier = crypto.pseudoRandomBytes(32).toString()

  const _payload: OAuthState = {
    ...payload,
    code_verifier: codeVerifier,
    _id: oauthStateId,
  }

  await redis.set(
    key,
    _payload,
    REDIS_OAUTH_STATE_TTL,
  )

  return _payload
}

export const remove = async (oauthStateId: string): Promise<void> => {
  const key = getKey(oauthStateId)

  await redis.del(key) as any
}
