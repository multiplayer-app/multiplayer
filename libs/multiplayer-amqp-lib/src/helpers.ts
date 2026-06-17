import stringify from 'json-stringify-safe'
import {
  SERVICE_NAME,
  AMQP_RECONNECT_MAX_OFFSET,
  AMQP_RECONNECT_INTERVAL,
} from './config'

/**
 * @description Formatted error.
 * @typedef {Object} FormattedError
 * @property {Number} message - error message
 * @property {String} stack - error stack
 * @property {boolean} service - name of service where error was thrown
 * @property {boolean} [name] - error name
 * @property {boolean} [status] - error status code
 */

/**
 * @description Format error before sending it.
 * @param {Error} err
 * @returns {FormattedError}
 */
export const formatError = (err) => ({
  message: err.message,
  service: SERVICE_NAME,
  stack: err.stack,
  ...err.name ? { name: err.name } : {},
  ...err.status ? { status: err.status } : {},
})

/**
 * @description Prepares data for sendinig it through rabbitmq.
 * @param {object} data
 * @returns {Buffer}
 */
export const formatOutputData = (data) => {
  if (typeof data === 'object' && data !== null) {
    return Buffer.from(stringify(data))
  }

  return Buffer.from(data)
}

/**
 * @description Calculates time difference between current and passed.
 * @param {NodeJS.HRTime} startTime
 * @returns {FormattedError}
 */
export const getDuration = (startTime) => {
  const diff = process.hrtime(startTime)
  return diff[0] * 1e3 + diff[1] * 1e-6
}

/**
 * @description Sleep.
 * @param {Number} ms
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const getReconnectInterval = () => {
  const maxOffset = Number(AMQP_RECONNECT_MAX_OFFSET)
  const offset = Math.floor(Math.random() * (maxOffset + maxOffset + 1) - maxOffset)

  return AMQP_RECONNECT_INTERVAL - offset
}

/**
 * @description Format message for logging. Removes state from being logged because it's too big
 * @param {Object} message
 * @returns {Object}
 */
export const formatMessageForLogging = (message) => ({
  ...message,
  ...message?.state ? { state: '***MASKED_STATE***' }: {},
  ...message?.variables?.state ? {
    variables: {
      ...message?.variables,
      state: '***MASKED_STATE***',
    },
  }: {},
})
