import type { Express, RequestHandler } from 'express'
import session, { CookieOptions } from 'express-session'
import RedisStore from 'connect-redis'
import * as redis from '@multiplayer/redis'
import {
  COOKIE_DOMAIN,
  COOKIE_SECRET,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  isProduction,
} from './config'

export const cookieOptions: CookieOptions = {
  domain: COOKIE_DOMAIN,
  maxAge: Number(COOKIE_MAX_AGE),
  httpOnly: true,
}

if (isProduction) {
  cookieOptions.secure = true
}

const redisClient = redis.createClient()
redisClient.connect()

const store = new RedisStore({
  client: redisClient,
  prefix: 'session:',
})

export const createSession = (sessionId, sessionData) => {
  const promise = new Promise((resolve, reject) => store.set(
    sessionId,
    sessionData,
    (err) => err ? reject(err) : resolve(true),
  ))

  return promise
}

const _expressSession = session({
  name: COOKIE_NAME,
  cookie: cookieOptions,
  secret: COOKIE_SECRET,
  store,
  saveUninitialized: false,
  resave: true, // Saves session even if there were no changes.
  rolling: true, // Resets cookie expiration according to maxAge on each response.
  unset: 'destroy',
})

export const expressSession = (): RequestHandler => {
  return _expressSession as RequestHandler
}

export const sessionMiddleware = (app: Express) => {
  app.set('trust proxy', 1)
  app.use(expressSession())
}
