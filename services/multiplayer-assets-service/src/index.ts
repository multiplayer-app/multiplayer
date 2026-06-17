import '@multiplayer/apm'
import 'dotenv/config'
import http from 'http'
import logger from '@multiplayer/logger'
import { app } from './app'
import { PORT } from './config'
import mongo from '@multiplayer/mongo'

const httpServer = http.createServer(app)
const onReady = () => {
  logger.info(`🚀 Server ready at http://localhost:${PORT}`)
}

httpServer.listen(PORT, onReady)

const exitHandler = async (error: Error) => {
  if (error) logger.info('Server exited with error', error)
  await mongo.disconnect()
  process.removeListener('exit', exitHandler)
  process.exit()
}

process.on('exit', exitHandler)
process.on('SIGINT', exitHandler)
process.on('SIGTERM', exitHandler)
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err)
})
