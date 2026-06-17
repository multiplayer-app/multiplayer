import logger from '@multiplayer/logger'
import connector from './connector'
import { formatOutputData } from './helpers'
import type { PublishOptions } from './types'

/**
 * @description Publishes message to AMQP queue.
 * @param {String} queue
 * @param {Object} message
 * @param {PublishOptions} [options]
 * @returns {Promise<void>}
 */
/* eslint-disable no-param-reassign */
const publish = async (
  queue: string,
  message: any,
  options: PublishOptions = {},
) => {
  await connector.connectPromise

  if (!connector.channel) {
    throw new Error('Failed to send message')
  }

  if (options?.fanout) {
    await connector.assertExchangeWithDefaultChannel(queue, options)
  } else {
    await connector.assertQueueWithDefaultChannel(queue, options)
  }

  logger.info({ message },`[AMQP] Publishing data to ${queue}`)

  if (options?.fanout) {
    await connector.channel.publish(queue, '', formatOutputData(message))
  } else {
    await connector.channel.sendToQueue(queue, formatOutputData(message))
  }
}

export default publish
