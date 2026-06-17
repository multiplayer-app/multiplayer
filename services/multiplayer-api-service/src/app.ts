import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import logger, { loggerExpressMiddleware } from '@multiplayer/logger'
import {
  sessionMiddleware,
  Config as AuthConfig,
} from '@multiplayer/auth'
import mongo from '@multiplayer/mongo'
import AMQP from '@multiplayer/amqp'
import redis from '@multiplayer/redis'
import {
  expressErrorHandlerMiddleware,
  corsMiddleware,
} from '@multiplayer/util'
import api from './api'
import crossDomainApis from './cross-domain-api'
import apiInternal from './api-internal'
import * as swagger from './swagger'
import { billingLimitNotificationMiddleware } from './middleware'
import {
  API_PREFIX,
  CORS_DOMAIN,
} from './config'
import { wellKnown } from './routes'

mongo.connect().catch(() => {
  logger.error('Error happened on initial Mongo connection. Exiting...')
  process.exit(1)
})
AMQP.connect()
redis.connect()

export const app = express()

app.disable('x-powered-by')
app.set('query parser', 'extended')

app.use('/.well-known', corsMiddleware({ corsDomain: '*' }), wellKnown)
app.use(`${API_PREFIX}/public`, crossDomainApis)


app.use(corsMiddleware({
  corsDomain: CORS_DOMAIN,
  allowedHeaders: [
    AuthConfig.AUTH_HEADER_NAME,
    AuthConfig.CURRENT_USER_HEADER_NAME,
    AuthConfig.OAUTH_HEADER_NAME,
  ],
}))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json({
  limit: '3mb',
  verify: (req, res, buf) => {
    const url = (req as any).originalUrl
    if (url.endsWith('/webhook')) {
      (req as any).rawBody = buf.toString()
    }
  },
}))
app.use(loggerExpressMiddleware())

swagger.init(app)

sessionMiddleware(app)

app.use(API_PREFIX, api)
app.use(`/internal${API_PREFIX}`, apiInternal)

// eslint-disable-next-line
// @ts-ignore
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send('Not found')
})

app.use(billingLimitNotificationMiddleware)
app.use(expressErrorHandlerMiddleware)
