import '@multiplayer/apm'
import 'dotenv/config'
import http from 'http'
import logger from '@multiplayer/logger'
import { app } from './app'
import { PORT } from './config'
import mongo from '@multiplayer/mongo'
import AMQP from '@multiplayer/amqp'
import { redisClient } from './redis'
import { Opensearch } from './lib'

const httpServer = http.createServer(app)
const onReady = () => {
  logger.info(`🚀 Server ready at http://localhost:${PORT}`)
}

redisClient.connect()
  .catch((err) => logger.error(err))
Opensearch.init().catch((err) => logger.error(err))

httpServer.listen(PORT, onReady)

const exitHandler = async (error: Error) => {
  if (error) logger.info('Server exited with error', error)
  await mongo.disconnect()
  await AMQP.disconnect()
  await redisClient.disconnect()
  process.removeListener('exit', exitHandler)
  process.exit()
}

process.on('exit', exitHandler)
process.on('SIGINT', exitHandler)
process.on('SIGTERM', exitHandler)
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err)
})
