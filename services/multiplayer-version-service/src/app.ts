import express, { type Request, type Response, type NextFunction } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import logger, { loggerExpressMiddleware } from '@multiplayer/logger'
import mongo from '@multiplayer/mongo'
import AMQP from '@multiplayer/amqp'
import {
  expressErrorHandlerMiddleware,
  corsMiddleware,
} from '@multiplayer/util'
import {
  sessionMiddleware,
  authorizeInternal,
  Config as AuthConfig,
} from '@multiplayer/auth'
import api from './api'
import apiInternal from './api-internal'
import * as swagger from './swagger'
import {
  API_PREFIX,
  AMQP_FORK_QUEUE,
  AMQP_CLEANUP_QUEUE,
  CORS_DOMAIN,
} from './config'
import {
  ForkListener,
  CleanupListener,
} from './listeners'
import { billingLimitNotificationMiddleware } from './middleware'

mongo.connect().catch(() => {
  logger.error('Error happened on initial Mongo connection. Exiting...')
  process.exit(1)
})
AMQP.connect()

export const app = express()

app.disable('x-powered-by')
app.set('query parser', 'extended')
app.use(corsMiddleware({
  corsDomain: CORS_DOMAIN ,
  allowedHeaders: [
    AuthConfig.AUTH_HEADER_NAME,
    AuthConfig.CURRENT_USER_HEADER_NAME,
    AuthConfig.OAUTH_HEADER_NAME,
  ],
}))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(loggerExpressMiddleware())

swagger.init(app)

sessionMiddleware(app)

app.use(API_PREFIX, api)
app.use(
  `/internal${API_PREFIX}`,
  authorizeInternal,
  apiInternal,
)

// eslint-disable-next-line
// @ts-ignore
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send('Not found')
})

app.use(billingLimitNotificationMiddleware)
app.use(expressErrorHandlerMiddleware)

AMQP.listen(
  AMQP_FORK_QUEUE,
  ForkListener,
  {
    durable: true,
    prefetch: 1,
  },
)

AMQP.listen(
  AMQP_CLEANUP_QUEUE,
  CleanupListener,
  {
    durable: true,
    prefetch: 1,
  },
)
