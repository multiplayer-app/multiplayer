import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongo from '@multiplayer/mongo'
import logger, { loggerExpressMiddleware } from '@multiplayer/logger'
import {
  authorizeInternal,
  sessionMiddleware,
  Config as AuthConfig,
} from '@multiplayer/auth'
import {
  expressErrorHandlerMiddleware,
  corsMiddleware,
} from '@multiplayer/util'
import api from './api'
import apiInternal from './api-internal'
import * as swagger from './swagger'
import passport from './passport'
import {
  API_PREFIX,
  CORS_DOMAIN,
} from './config'
import { GitHubApp } from './libs'
import { connectAMQP } from './amqp'
import { billingLimitNotificationMiddleware } from './middleware'

mongo.connect().catch((err) => {
  logger.error(err, 'Error happened on initial Mongo connection. Exiting...')
  process.exit(1)
})
connectAMQP().catch((err) => {
  logger.error(err, 'AMQP init failed')
  process.exit(1)
})

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

app.use(passport.initialize())

app.use(API_PREFIX, GitHubApp.githubAppMiddleware)
app.use(API_PREFIX, api)
app.use(`/internal${API_PREFIX}`, authorizeInternal, apiInternal)

// eslint-disable-next-line
// @ts-ignore
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send('Not found')
})

app.use(billingLimitNotificationMiddleware)
app.use(expressErrorHandlerMiddleware)
