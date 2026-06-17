import '@multiplayer/apm'
import 'dotenv/config'
import http from 'http'
import logger from '@multiplayer/logger'
import { PORT } from './config'
import { app } from './app'
import AMQP from '@multiplayer/amqp'
import mongo from '@multiplayer/mongo'

mongo.connect()

const httpServer = http.createServer(app)

const onReady = () => {
  logger.info(`🚀 Server ready at http://localhost:${PORT}`)
}

httpServer.listen(PORT, onReady)

const events = [
  'exit',
  'SIGINT',
  'SIGTERM',
  'uncaughtException',
]

const exitHandler = async (error: Error) => {
  if (error) {
    logger.error(error, 'Server exited with error')
  }
  await AMQP.disconnect()
  await mongo.disconnect()
  events.forEach(event => process.removeListener(event, exitHandler))
  process.exit(Number(!!error))
}

events.forEach(event => process.on(event, exitHandler))
