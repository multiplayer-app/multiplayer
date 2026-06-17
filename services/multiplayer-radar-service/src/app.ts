import path from 'path'
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { CronJob } from 'cron'
import { loggerExpressMiddleware } from '@multiplayer/logger'
import {
  sessionMiddleware,
  Config as AuthConfig,
} from '@multiplayer/auth'
import mongo from '@multiplayer/mongo'
import redis from '@multiplayer/redis'
import * as Clickhouse from '@multiplayer/clickhouse'
import {
  expressErrorHandlerMiddleware,
  corsMiddleware,
} from '@multiplayer/util'
import api from './api'
import * as swagger from './swagger'
import {
  OtelLogsWorker,
  OtelTracesWorker,
  FlowWorker,
  DebugSessionWorker,
  SessionNotesWorker,
  SocketWorker,
  AgentWorker,
  ChatWorker,
} from './worker'
import {
  API_PREFIX,
  KAFKA_OTEL_D0C_TRACES_TOPIC,
  KAFKA_OTEL_DEB_LOGS_TOPIC,
  KAFKA_OTEL_DEB_TRACES_TOPIC,
  KAFKA_OTEL_CDB_LOGS_TOPIC,
  KAFKA_OTEL_CDB_TRACES_TOPIC,
  KAFKA_OTEL_ERROR_SPAN_TOPIC,
  CORS_DOMAIN,
  KAFKA_CONSUME_CONCURRENT_PARTITIONS,
  KAFKA_SESSION_NOTES_UPDATE_TOPIC,
} from './config'
import * as amqp from './amqp'
import {
  kafkaConsumer,
  kafkaProducer,
} from './libs'
import * as IntegrationService from './services/integration.service'
import debugSessionsAgent from './routes/debug-sessions-agent'
import continuousDebugSessionsAgent from './routes/continuous-debug-sessions-agent'
import remoteSessionsRecordingAgent from './routes/conditional-recording-agent'
import metricsAgent from './routes/metrics-agent'
import {
  REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX,
  REDIS_OTEL_FLOW_KEY_CACHE_PREFIX,
  REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX,
} from './config'

mongo.connect()
redis.connect().then(async () => {
  await redis.subscribeOnExpire(async (expiredKey: string) => {
    if (expiredKey.startsWith(REDIS_OTEL_FLOW_KEY_CACHE_PREFIX)) {
      await FlowWorker.createFlow(expiredKey)
    } else if (expiredKey.startsWith(REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX)) {
      await DebugSessionWorker.stopDebugSession(expiredKey)
    } else if (expiredKey.startsWith(REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX)) {
      await IntegrationService.addNotAppliedDetectionsToAutoMergeQueue(expiredKey)
    } else {
      // logger.debug({ expiredKey }, '[REDIS-LISTENER] Invalid expired key')
    }
  })
})
Clickhouse.connect()
kafkaConsumer.connect().then(async () => {
  await kafkaConsumer.subscribe(
    KAFKA_OTEL_D0C_TRACES_TOPIC,
    OtelTracesWorker.handleD0cOtelTraceFromKafka,
  )
  await kafkaConsumer.subscribe(
    KAFKA_OTEL_DEB_LOGS_TOPIC,
    OtelLogsWorker.handleDebOtelLogFromKafka,
  )
  await kafkaConsumer.subscribe(
    KAFKA_OTEL_DEB_TRACES_TOPIC,
    OtelTracesWorker.handleDebOtelTraceFromKafka,
  )

  await kafkaConsumer.subscribe(
    KAFKA_OTEL_CDB_LOGS_TOPIC,
    OtelLogsWorker.handleCdbOtelLogFromKafka,
  )
  await kafkaConsumer.subscribe(
    KAFKA_OTEL_CDB_TRACES_TOPIC,
    OtelTracesWorker.handleCdbOtelTraceFromKafka,
  )

  await kafkaConsumer.subscribe(
    KAFKA_OTEL_ERROR_SPAN_TOPIC,
    OtelTracesWorker.handleErrorTraceFromKafka,
  )

  await kafkaConsumer.subscribe(
    KAFKA_SESSION_NOTES_UPDATE_TOPIC,
    SessionNotesWorker.processMessage,
  )
  await kafkaConsumer.listen({
    partitionsConsumedConcurrently: KAFKA_CONSUME_CONCURRENT_PARTITIONS,
  })

  await kafkaProducer.connect()
  await SessionNotesWorker.processLeftUpdates(kafkaProducer, KAFKA_SESSION_NOTES_UPDATE_TOPIC)
})

export const app = express()

app.disable('x-powered-by')
app.set('query parser', 'extended')
app.use(bodyParser.json({
  limit: '200mb',
}))
app.use(loggerExpressMiddleware())

app.use(cookieParser())
sessionMiddleware(app)

app.use(`${API_PREFIX}/debug-sessions`, debugSessionsAgent)
app.use(`${API_PREFIX}/continuous-debug-sessions`, continuousDebugSessionsAgent)
app.use(`${API_PREFIX}/remote-session-recording`, remoteSessionsRecordingAgent)
app.use(`${API_PREFIX}/metrics`, metricsAgent)

app.use(corsMiddleware({
  corsDomain: CORS_DOMAIN,
  allowedHeaders: [
    AuthConfig.AUTH_HEADER_NAME,
    AuthConfig.CURRENT_USER_HEADER_NAME,
    AuthConfig.OAUTH_HEADER_NAME,
    'x-socket-id',
  ],
}))

swagger.init(app)

app.use(API_PREFIX, api)

app.use(`${API_PREFIX}/static`,
  express.static(path.join(__dirname, '../static/build')),
)

// eslint-disable-next-line
// @ts-ignore
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).send('Not found')
})

app.use(expressErrorHandlerMiddleware)

amqp.init()

new CronJob(
  '*/20 * * * *',
  DebugSessionWorker.stopStuckDebugSessions,
  null,
  true,
)

new CronJob(
  '*/5 * * * *',
  SocketWorker.clearStuckSocketConnections,
  null,
  true,
)

new CronJob(
  '*/2 * * * *',
  AgentWorker.clearStuckSocketsForAgents,
  null,
  true,
)

void ChatWorker.clearStuckProcessingChats()
