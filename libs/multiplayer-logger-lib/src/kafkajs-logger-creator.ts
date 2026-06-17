import bunyan, { type LoggerOptions } from 'bunyan'
import { hostname } from 'os'
import { isProduction, APP_NAME } from './config'

const HOST_NAME = hostname()

const loggerOptions: LoggerOptions = {
  name: APP_NAME,
  level: isProduction ? 'info' : 'debug',
  hostname: HOST_NAME,
}

export const KafkaJsLogCreator = (logLevelConverter: any) => (level: any) => {
  if (level) {
    loggerOptions.level = logLevelConverter(level)
  }
  const logger = bunyan.createLogger(loggerOptions)

  return ({ level, log }) => {
    const { message, ...extra } = log
    logger[logLevelConverter(level)]({
      extra,
    }, message)
  }
}
