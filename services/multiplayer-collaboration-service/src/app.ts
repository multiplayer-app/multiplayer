import express from 'express'
import {
  sessionMiddleware,
  Config as AuthConfig,
} from '@multiplayer/auth'
import { loggerExpressMiddleware } from '@multiplayer/logger'
import { PrometheusMetricsHandler } from '@multiplayer/prometheus'
import { corsMiddleware } from '@multiplayer/util'
import api from './api'
import {
  API_PREFIX,
  CORS_DOMAIN,
} from './config'
import { prometheusClient } from './prometheus'
import * as swagger from './swagger'

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
app.use(loggerExpressMiddleware())
swagger.init(app)
app.use(API_PREFIX, api)
app.get('/metrics', PrometheusMetricsHandler(prometheusClient))
sessionMiddleware(app)
