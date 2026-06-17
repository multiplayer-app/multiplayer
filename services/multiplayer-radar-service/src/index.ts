import '@multiplayer/apm'
import 'dotenv/config'
import http from 'http'
import logger from '@multiplayer/logger'
import * as Clickhouse from '@multiplayer/clickhouse'
import { app } from './app'
import { PORT } from './config'
import * as websocket from './websocket'
import { kafkaConsumer, kafkaProducer } from './libs'

const httpServer = http.createServer(app)

const onReady = () => {
  logger.info(`🚀 Server ready at http://localhost:${PORT}`)
}

websocket.start(httpServer)

httpServer.listen(PORT, onReady)

const events = [
  'exit',
  'SIGINT',
  'SIGTERM',
]

const exitHandler = async (error: any) => {
  if (error) {
    logger.error(error, 'Server exited with error')
  }
  await Clickhouse.disconnect()
  await kafkaConsumer.disconnect()
  await kafkaProducer.disconnect()
  events.forEach(event => process.removeListener(event, exitHandler))
  process.exit(Number(!!error))
}

events.forEach(event => process.on(event, exitHandler))

process.on('uncaughtException', (error: any) => {
  logger.error(error, 'uncaughtException')
})
