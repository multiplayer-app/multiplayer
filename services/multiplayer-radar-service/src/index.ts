import '@multiplayer/apm'
import 'dotenv/config'
import http from 'http'
import logger from '@multiplayer/logger'
import { app } from './app'
import { PORT } from './config'
import * as websocket from './websocket'
import { kafkaConsumer, kafkaStoreConsumer, kafkaProducer } from './libs'
import { Store } from './store'
import * as StoreLeaderElection from './store/leader-election'
import * as StoreLeaderListener from './store/leader-listener'

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
  // Stop taking on new store work before tearing down the store connection itself:
  // release the RPC listener and the store-topic consumer (no-ops if this replica
  // wasn't leader), then release the election lease so a rolling deploy fails over
  // immediately instead of waiting out the lease TTL (see leader-election.ts).
  await StoreLeaderListener.stop()
  await kafkaStoreConsumer.disconnect()
  await StoreLeaderElection.stop()
  await Store.disconnect()
  await kafkaConsumer.disconnect()
  await kafkaProducer.disconnect()
  events.forEach(event => process.removeListener(event, exitHandler))
  process.exit(Number(!!error))
}

events.forEach(event => process.on(event, exitHandler))

process.on('uncaughtException', (error: any) => {
  logger.error(error, 'uncaughtException')
})
