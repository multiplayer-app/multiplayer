import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import { loggerExpressMiddleware } from '@multiplayer/logger'
import AMQP from '@multiplayer/amqp'
import {
  expressErrorHandlerMiddleware,
  corsMiddleware,
} from '@multiplayer/util'
import api from './api'
import * as swagger from './swagger'
import {
  API_PREFIX,
  AMQP_LISTEN_QUEUE,
  CORS_DOMAIN,
} from './config'
import { AmqpListener } from './listener'

AMQP.connect()

export const app = express()

app.disable('x-powered-by')
app.set('query parser', 'extended')
app.use(corsMiddleware({ corsDomain: CORS_DOMAIN }))
app.use(loggerExpressMiddleware())

swagger.init(app)

app.use(API_PREFIX, api)

// eslint-disable-next-line
// @ts-ignore
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send('Not found')
})

app.use(expressErrorHandlerMiddleware)

AMQP.listen(
  AMQP_LISTEN_QUEUE,
  AmqpListener,
  {
    durable: false,
    prefetch: 3,
  },
)
