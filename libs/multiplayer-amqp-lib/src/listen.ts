
import logger from '@multiplayer/logger'
import connector from './connector'
import {
  formatOutputData,
  formatError,
  formatMessageForLogging,
} from './helpers'
import type { ListenOptions, Channel } from './types'

const listeners: any[] = []
let firstConnection = true
// Tracks active consumers per queue so stopListening() can cancel them. Only
// consumers established via listen() (not other AMQP.* callers) are tracked here.
const activeConsumers: Record<string, { channel: Channel, consumerTag: string }[]> = {}

/**
 * @description Wrapper for listener callback function. Handles errors and tracks them.
 * @private
 * @param {String} queue - listening queue
 * @param {Object} channel - amqp channel
 * @param {function(message)} callback - message handler function
 * @returns {function(message): void} - listener function
 */

const _listenFnWrapper = (
  queue: string,
  channel: Channel,
  callback: (message: any) => any,
) => {

  const messageHandler = async (message) => {
    let incomingMessage = {}
    let failedToParseMessage = false

    try {
      incomingMessage = JSON.parse(message.content.toString('utf8'))
    } catch (err) {
      failedToParseMessage = true
    }


    try {
      if (failedToParseMessage) {
        throw new Error('Failed to parse incoming message')
      }

      let outputMessage: any = {}
      const { correlationId, replyTo } = message?.properties || {}

      try {
        incomingMessage = JSON.parse(message.content.toString('utf8'))

        logger.info(
          {
            incomingMessage: formatMessageForLogging(incomingMessage),
            queue,
          },
          '[AMQP] Received message from queue',
        )

        outputMessage = await callback(incomingMessage) || {}
      } catch (callbackError: any) {
        logger.error(
          {
            err: {
              ...callbackError,
              stack: callbackError.stack,
            },
            queue,
          },
          '[AMQP] Callback function error',
        )

        outputMessage = {
          error: formatError(callbackError),
        }

        if (!correlationId || !replyTo) {
          throw callbackError
        }
      }

      if (correlationId && replyTo) {
        logger.info(
          {
            correlationId,
            outputMessage: formatMessageForLogging(outputMessage),
            queue,
          },
          `[AMQP] Sent response message to ${replyTo}`,
        )
        channel.sendToQueue(replyTo, formatOutputData(outputMessage), { correlationId })
      }

      channel.ack(message)
    } catch (messageHandlerError) {
      logger.error({
        ...!failedToParseMessage ? { incomingMessage } : {},
        messageHandlerError,
        queue,
      }, '[AMQP] Message handler error')
      const redeliver = !message.fields.redelivered || message.fields.deliveryTag < 3
      channel.nack(message, false, redeliver)
    }
  }

  return messageHandler
}

/**
 * @description Adds listener function to AMQP queue.
 * @param {String} queue
 * @param {Function} callback
 * @param {ListenOptions} [options]
 * @param {Boolean} reattaching
 * @returns {Promise<string>} - the consumerTag, usable with stopListening()
 */
const listen = async (
  queue: string,
  callback,
  options: ListenOptions = {},
  reattaching = false,
) => {
  if (!reattaching) {
    listeners.push({ callback, options, queue })
  }

  await connector.connectPromise

  const channel = await connector.createChannel()

  await channel.assertQueue(queue, { durable: options.durable || false })

  if (options.prefetch) {
    logger.info(`[AMQP] Setting prefetch number to ${options.prefetch} for queue ${queue}`)
    await channel.prefetch(options.prefetch)
  }

  logger.info(`[AMQP] Listening ${queue} queue`)

  const { consumerTag } = await channel.consume(queue, _listenFnWrapper(queue, channel, callback))

  if (!activeConsumers[queue]) {
    activeConsumers[queue] = []
  }
  activeConsumers[queue].push({ channel, consumerTag })

  return consumerTag
}

/**
 * @description Stops all active consumers for a queue previously subscribed via
 * listen() and prevents them from being re-established on the next broker reconnect.
 * Used to gate consumption on a runtime condition (e.g. leader election) rather than
 * process lifetime - listen() itself has no notion of "temporarily stop".
 * @param {String} queue
 * @returns {Promise<void>}
 */
const stopListening = async (queue: string) => {
  const consumers = activeConsumers[queue] || []
  delete activeConsumers[queue]

  for (let i = listeners.length - 1; i >= 0; i -= 1) {
    if (listeners[i].queue === queue) {
      listeners.splice(i, 1)
    }
  }

  await Promise.all(consumers.map(async ({ channel, consumerTag }) => {
    try {
      await channel.cancel(consumerTag)
      await channel.close()
    } catch (err) {
      logger.error(err, `[AMQP] Failed to stop consumer for queue ${queue}`)
    } finally {
      // Un-track it regardless of close outcome - connector.disconnect() also closes
      // every channel it knows about, and closing an already-closed channel throws.
      const index = connector.channels.indexOf(channel)

      if (index !== -1) {
        connector.channels.splice(index, 1)
      }
    }
  }))

  logger.info(`[AMQP] Stopped listening ${queue} queue`)
}

/**
 * @description Reattach listeners after reconnect
 * @private
 * @returns {void}
 */
const reattachListeners = () => {
  if (firstConnection) {
    firstConnection = false
  } else {
    listeners.forEach((listener) => {
      listen(listener.queue,
        listener.callback,
        listener.options,
        true)
    })
  }
}

connector.on('connected', reattachListeners)

export { stopListening }
export default listen
