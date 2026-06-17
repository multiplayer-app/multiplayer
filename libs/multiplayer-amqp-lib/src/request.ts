import crypto from 'crypto'
import { AMQP_RPC_TIMEOUT } from './config'
import logger from '@multiplayer/logger'
import connector from './connector'
import {
  formatOutputData,
  getDuration,
  formatMessageForLogging,
} from './helpers'
import type { RequestOptions } from './types'

/**
 * @description Request data wrapper.
 * @param {String} queue
 * @param {Object} message
 * @param {Number} [rpcTimeout]
 * @returns {Promise<Object>} - rpc response
 */
const _requestData = (queue, message, rpcTimeout) => new Promise((resolve, reject) => {
  const correlationId = crypto.randomBytes(7).toString('hex')
  const reqStart = process.hrtime()
  // eslint-disable-next-line
  let timeout

  connector.channel.responseEmitter.once(correlationId,
    (response) => {
      clearTimeout(timeout)
      connector.channel.responseEmitter.removeAllListeners(correlationId)
      const responseMessage = JSON.parse(response.content.toString('utf8'))

      const logLevel = Object.keys(responseMessage?.error || {}).length > 0 ? 'error' : 'info'

      logger[logLevel](
        {
          correlationId,
          duration: getDuration(reqStart),
          responseMessage: formatMessageForLogging(responseMessage),
        },
        `[AMQP] Received response from ${queue}`,
      )

      if (logLevel === 'error') {
        return reject(responseMessage)
      }

      return resolve(responseMessage)
    })

  logger.info(
    {
      correlationId,
      message: formatMessageForLogging(message),
    },
    `[AMQP] Requesting data from ${queue}`,
  )

  connector.channel.sendToQueue(
    queue,
    formatOutputData(message),
    {
      arguments: { 'x-message-ttl': 5000 },
      correlationId,
      durable: false,
      replyTo: 'amq.rabbitmq.reply-to',
    },
  )

  timeout = setTimeout(() => {
    logger.error({ correlationId, message }, `[AMQP] RPC timeout from ${queue}`)
    connector.channel.responseEmitter.removeAllListeners(correlationId)
    return reject(new Error(`[AMQP] RPC timeout from ${queue}`))
  }, rpcTimeout || AMQP_RPC_TIMEOUT)
})

/**
 * @description Requests data from AMQP queue.
 * @param {String} queue
 * @param {Object} message
 * @param {RequestOptions} [options]
 * @returns {Promise<void>}
 */
/* eslint-disable no-param-reassign */
const request = async (
  queue: string,
  message: any,
  options: RequestOptions = {},
) => {
  await connector.connectPromise

  await connector.assertQueueWithDefaultChannel(queue, { durable: false })

  return _requestData(queue, message, options.timeout)
}

export default request
