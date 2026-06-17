import bunyan, {
  type LoggerOptions,
  type LogLevelString,
} from 'bunyan'
import { hostname } from 'os'
import {
  APP_NAME,
  LOG_LEVEL,
} from './config'

const HOST_NAME = hostname()

const loggerOptions: LoggerOptions = {
  name: APP_NAME,
  level: LOG_LEVEL as LogLevelString,
  hostname: HOST_NAME,
  serializers: bunyan.stdSerializers,
}

export const logger = bunyan.createLogger(loggerOptions)

// const events = [
//   'exit',
//   'SIGINT',
//   'SIGTERM',
//   'uncaughtException',
// ]

// const exit = () => {
//   // logger.reopenFileStreams()
// }

// events.forEach(event => process.on(event, exit))
