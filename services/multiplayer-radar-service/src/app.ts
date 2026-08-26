import path from 'path'
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { CronJob } from 'cron'
import logger, { loggerExpressMiddleware } from '@multiplayer/logger'
import {
  sessionMiddleware,
  Config as AuthConfig,
} from '@multiplayer/auth'
import mongo from '@multiplayer/mongo'
import redis from '@multiplayer/redis'
import { Store } from './store'
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
  ANALYTICS_DB_ENGINE,
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
  kafkaStoreConsumer,
  kafkaProducer,
} from './libs'
import * as StoreLeaderElection from './store/leader-election'
import * as StoreLeaderListener from './store/leader-listener'
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

// The 5 Store-backed topics (debug/continuous-debug-session spans+logs, error spans)
// run on their own consumer/groupId so they can be gated by leadership when
// ANALYTICS_DB_ENGINE=duckdb (a single embedded local file per pod can only be safely
// written by one replica - see src/store/leader-election.ts). In clickhouse mode
// (a real shared server, no such constraint) this consumer just starts once at boot
// like any other, unconditionally, on every replica.
let storeConsumerTopicsSubscribed = false

const startStoreConsumer = async () => {
  if (!storeConsumerTopicsSubscribed) {
    await kafkaStoreConsumer.subscribe(
      KAFKA_OTEL_DEB_LOGS_TOPIC,
      OtelLogsWorker.handleDebOtelLogFromKafka,
    )
    await kafkaStoreConsumer.subscribe(
      KAFKA_OTEL_DEB_TRACES_TOPIC,
      OtelTracesWorker.handleDebOtelTraceFromKafka,
    )
    await kafkaStoreConsumer.subscribe(
      KAFKA_OTEL_CDB_LOGS_TOPIC,
      OtelLogsWorker.handleCdbOtelLogFromKafka,
    )
    await kafkaStoreConsumer.subscribe(
      KAFKA_OTEL_CDB_TRACES_TOPIC,
      OtelTracesWorker.handleCdbOtelTraceFromKafka,
    )
    await kafkaStoreConsumer.subscribe(
      KAFKA_OTEL_ERROR_SPAN_TOPIC,
      OtelTracesWorker.handleErrorTraceFromKafka,
    )
    storeConsumerTopicsSubscribed = true
  }

  await kafkaStoreConsumer.connect()
  await kafkaStoreConsumer.listen({
    partitionsConsumedConcurrently: KAFKA_CONSUME_CONCURRENT_PARTITIONS,
    // This is a brand-new consumer group (split out from the main `radar` group) -
    // fromBeginning only matters the very first time a group is ever seen, and
    // replaying all retained history into the analytics store would flood duplicates
    // (these tables are append-only with no dedup). Once committed offsets exist,
    // reconnecting (e.g. regaining leadership) always resumes from them regardless
    // of this flag.
    fromBeginning: false,
  })
}

const stopStoreConsumer = async () => {
  await kafkaStoreConsumer.disconnect()
}

const onGainLeadership = () => {
  void startStoreConsumer().catch(err => logger.error(err, '[STORE-LEADER] Failed to start store kafka consumer'))
  void StoreLeaderListener.start().catch(err => logger.error(err, '[STORE-LEADER] Failed to start store RPC listener'))
}

const onLossLeadership = () => {
  void stopStoreConsumer().catch(err => logger.error(err, '[STORE-LEADER] Failed to stop store kafka consumer'))
  void StoreLeaderListener.stop().catch(err => logger.error(err, '[STORE-LEADER] Failed to stop store RPC listener'))
}

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

  // No-op unless ANALYTICS_DB_ENGINE=duckdb (see leader-election.ts) - in clickhouse
  // mode these hooks simply never fire.
  StoreLeaderElection.start({ onGain: onGainLeadership, onLoss: onLossLeadership })
})
Store.connect().catch(err => logger.error(err, '[STORE] Failed to connect'))
kafkaConsumer.connect().then(async () => {
  await kafkaConsumer.subscribe(
    KAFKA_OTEL_D0C_TRACES_TOPIC,
    OtelTracesWorker.handleD0cOtelTraceFromKafka,
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

if (ANALYTICS_DB_ENGINE !== 'duckdb') {
  // Election is inert in clickhouse mode, so nothing will ever call startStoreConsumer
  // via onGain - start it the same way every other consumer here starts: once, at
  // boot, unconditionally, on every replica (matches pre-split behavior exactly).
  void startStoreConsumer().catch(err => logger.error(err, '[STORE] Failed to start store kafka consumer'))
}

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

// Stuck-chat sweep: boot pass (recover state orphaned by the previous deploy)
// plus a cron so persisted respondBy deadlines are enforced even when the
// in-memory timers died with a previous instance.
new CronJob(
  '*/2 * * * *',
  ChatWorker.clearStuckProcessingChats,
  null,
  true,
)

void ChatWorker.clearStuckProcessingChats()
