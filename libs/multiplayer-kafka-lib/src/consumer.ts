import { Consumer, ConsumerRunConfig, Message } from 'kafkajs'
import logger from '@multiplayer/logger'
import { Timer } from '@multiplayer/util'
import { kafka } from './kafka'
import { KAFKA_SESSION_TIMEOUT } from './config'

export type KafkaConsumerListener = (key, value) => void | Promise<void>
export class KafkaConsumer {
  private consumer: Consumer
  private listeners: Record<string, KafkaConsumerListener[]> = {}
  private lastHeartbeat: number = 0

  constructor(groupId: string) {
    this.consumer = kafka.consumer({
      groupId,
      sessionTimeout: KAFKA_SESSION_TIMEOUT,
    })
    this.consumer.on(this.consumer.events.HEARTBEAT, ({ timestamp }) => {
      this.lastHeartbeat = timestamp
    })
    this.consumer.on(this.consumer.events.REQUEST_TIMEOUT, ({ timestamp }) => {
      this.lastHeartbeat = 0
    })
    this.consumer.on(this.consumer.events.CRASH, ({ timestamp }) => {
      this.lastHeartbeat = 0
    })
  }

  public async isConnected() {
    if (Date.now() - this.lastHeartbeat < KAFKA_SESSION_TIMEOUT) {
      return true
    }
    try {
      const { state } = await this.consumer.describeGroup()
      return ['CompletingRebalance', 'PreparingRebalance', 'Stable'].includes(state)
    } catch (err) {
      return false
    }
  }

  public async connect() {
    await this.consumer.connect()
  }

  public async disconnect() {
    await this.consumer.disconnect()
  }

  public async subscribe(topic: string, listener: KafkaConsumerListener) {
    logger.info({ topic }, '[KAFKAJS] Subscribing for topic')

    if (!this.listeners[topic]) {
      this.listeners[topic] = []
    }
    this.listeners[topic].push(listener)
  }

  private async listenFnWrapper(
    topic: string,
    message: Message,
  ) {

    const parseStartTime = Timer.startTimer()
    try {
      if (!this.listeners[topic]?.length) {
        logger.error(`[KAFKAJS] Missing handler for topic ${topic}`)
      }

      if (!message?.value) {
        return
      }

      const key = message?.key?.toString('utf8')
      const value = JSON.parse(message.value.toString('utf8'))

      logger.trace(
        {
          topic,
          key,
          value,
        },
        `[KAFKAJS] Received message from topic ${topic}`,
      )

      await Promise.all(this.listeners[topic].map(func => func(key, value)))

      logger.debug({
        key,
        topic,
        duration: Timer.getDuration(parseStartTime),
      }, '[KAFKAJS] Done with processing data from kafka')
    } catch (err) {
      logger.error(err, '[KAFKAJS] Error on handling incoming message')
    }
  }

  public async listen(options: Omit<ConsumerRunConfig, 'eachMessage' | 'eachBatch'> = {
    partitionsConsumedConcurrently: 3, autoCommit: true,
  }) {
    const topics = Object.keys(this.listeners)

    await this.consumer.subscribe({
      topics,
      fromBeginning: true,
    })

    await this.consumer.run({
      autoCommit: true,
      ...options,
      eachMessage: async ({ topic, message }) => this.listenFnWrapper(topic, message),
    })
  }

  public async listenBatch(options: Omit<ConsumerRunConfig, 'eachMessage' | 'eachBatch'>) {
    const topics = Object.keys(this.listeners)

    await this.consumer.subscribe({
      topics,
      fromBeginning: true,
    })

    await this.consumer.run({
      eachBatchAutoResolve: true,
      ...options,
      eachBatch: async ({
        batch,
        resolveOffset,
        heartbeat,
        commitOffsetsIfNecessary,
        uncommittedOffsets,
        isRunning,
        isStale,
        pause,
      }) => {
        for (const message of batch.messages) {
          if (!this.listeners[batch.topic]?.length) {
            logger.error(`[KAFKAJS] Missing handler for topic ${batch.topic}`)
          }

          try {
            await Promise.all(batch.messages.map(message => this.listenFnWrapper(batch.topic, message)))
          } catch (batchError) {
            logger.error(batchError, '[KAFKAJS] Batch fn error')
          }

          resolveOffset(message.offset)
          await heartbeat()
        }
      },
    })
  }
}
