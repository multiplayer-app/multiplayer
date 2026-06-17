import '@multiplayer/apm'
import 'dotenv/config.js'
import { default as initWebsocketServer, redisPubClient, redisSubClient } from './socketio'
import http from 'http'
import { app } from './app'
import logger from '@multiplayer/logger'
import { PORT } from './config'
import mongo from '@multiplayer/mongo'
import { AMQPListener } from './amqp'
import { YjsEntitiesSocketIO } from './yjs/yjs-entities-socket-io'
import { prometheusClient } from './prometheus'
import { kafkaProducer } from './kafka'

function connectKafka() {
  kafkaProducer.connect().catch(() => {
    logger.error('Error happened on Kafka producer connection. Retrying....')
    setTimeout(connectKafka, 3000)
  })
}

function connectAmqp(amqpListener: AMQPListener) {
  amqpListener.connect().catch(() => {
    logger.error('Error happened on AMQP connection. Retrying....')
    setTimeout(() => connectAmqp(amqpListener), 3000)
  })
}

function connectMongo() {
  mongo.connect().catch(() => {
    logger.error('Error happened on initial Mongo connection. Exiting...')
    process.exit(1)
  })
}

async function connectServer() {
  const httpServer = http.createServer(app)
  httpServer.listen(+PORT, () => {
    logger.info(`🚀 Server ready at http://localhost:${PORT}`)
  })

  return initWebsocketServer(httpServer)
    .catch((err) => {
      logger.error(err, 'Error happened on sockets init. Exiting...')
      process.exit(1)
    })
}

let amqpListener: AMQPListener | undefined

const exitHandler = async (error: Error) => {
  if (error) logger.info('Server exited', error)
  await amqpListener?.disconnect()
  if (mongo.connected()) {
    logger.info('Mongo disconnect')
    await mongo.disconnect()
  }
  await kafkaProducer.disconnect()
  await redisPubClient.disconnect()
  await redisSubClient.disconnect()
  logger.info('Server shut down')
  process.removeListener('exit', exitHandler)
  process.exit()
}

process.on('exit', exitHandler)
process.on('SIGINT', exitHandler)
process.on('SIGTERM', exitHandler)
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err)
})

prometheusClient.collectDefaultMetrics({ service: 'collaboration' })
connectKafka()
connectMongo()
connectServer().then(({ yjsIOs, projectIO }) => {
  amqpListener = new AMQPListener(yjsIOs[0] as YjsEntitiesSocketIO, projectIO)
  return connectAmqp(amqpListener)
})
