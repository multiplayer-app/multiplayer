import { Kafka, logLevel } from 'kafkajs'
import { KAFKA_CLIENT_ID, KAFKA_URI } from './config'
import { KafkaJsLogCreator } from '@multiplayer/logger'


const toBunyanLogLevel = level => {
  switch (level) {
    case logLevel.ERROR:
    case logLevel.NOTHING:
      return 'error'
    case logLevel.WARN:
      return 'warn'
    case logLevel.INFO:
      return 'info'
    case logLevel.DEBUG:
      return 'debug'
    default:
      return 'info'
  }
}


export const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_URI,
  logCreator: KafkaJsLogCreator(toBunyanLogLevel),
})
