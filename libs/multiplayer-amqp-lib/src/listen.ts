
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

/**
 * @description Wrapper for listener callback function. Handles errors and tracks them.
 * @private
 * @param {String} queue - listening queue
 * @param {Object} channel - amqp channel
 * @param {function(message)} callback - message handler function
 * @returns {function(message): void} - listener function
 */
/* eslint-disable-next-line max-lines-per-function */
const _listenFnWrapper = (
  queue: string,
  channel: Channel,
  callback: (message: any) => any,
) => {
  /* eslint-disable-next-line complexity, max-statements, max-lines-per-function */
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
 * @returns {Promise<void>}
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

  await channel.consume(queue, _listenFnWrapper(queue, channel, callback))
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

export default listen
