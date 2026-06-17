import amqp from 'amqplib'
import EventEmitter from 'events'
import {
  AMQP_URI,
  AMQP_RECONNECT_INTERVAL,
} from './config'
import logger from '@multiplayer/logger'
import { sleep, getReconnectInterval } from './helpers'
import type {
  ConnectOptions,
  PublishOptions,
  Channel,
  AssertExchangeOptions,
} from './types'

/* eslint-disable class-methods-use-this */
class AmqpConnector extends EventEmitter {
  amqpUrl: string
  private _amqpUrlMasked: string
  connected: boolean
  connectOptions: ConnectOptions
  connection: amqp.Connection | false
  channel: any
  forceDisconnect: boolean
  channels: any[]
  assertedQueuesMapping: any
  assertedExchangesMapping: any
  connectPromise: Promise<any>

  constructor () {
    super()

    this.amqpUrl = AMQP_URI
    this._amqpUrlMasked = this.amqpUrl
    this.connectOptions = {}
    this.connected = false
    this.connection = false
    // Default channel
    this.channel = false
    this.forceDisconnect = false
    this.channels = []
    this.assertedQueuesMapping = {}
    this.assertedExchangesMapping = {}

    this.connectPromise = new Promise(()=> {})
    this._resetConnectorPromise()

    this.on('disconnected', ({ forceDisconnect }) => {
      if (!forceDisconnect) {
        this.tryConnect()
      }
    })
  }

  private set amqpUrlMasked (amqpUrl: string) {
    this._amqpUrlMasked = amqpUrl.replace(/:\/\/(?<username>.*):(?<password>.*)@/u, '://***:***@')
  }

  private get amqpUrlMasked() {
    return this._amqpUrlMasked
  }

  /**
   * @description Resets connector promise.
   * @private
   * @returns {Promise<void>}
   */
  private _resetConnectorPromise (): void {
    this.connectPromise = new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.connection && this.channel) {
          clearInterval(interval)
          resolve(0)
        }
      }, Number(AMQP_RECONNECT_INTERVAL) / 2)
    })
  }

  /**
   * @description Function for logging errors.
   * @private
   * @param {Error} err
   * @returns {void}
   */
  _onError (err) {
    if (err.message !== 'Connection closing') {
      logger.error(`[AMQP] ERROR: ${err.message}`)
    }
  }

  /**
   * @description Function for handling close event.
   * @private
   * @returns {void}
   */
  _onClose () {
    logger.info('[AMQP] Connection closed')

    // Remove connection reference as it's now closed anyway.
    if (this.connection) {
      this.connection.removeAllListeners('blocked')
      this.connection.removeAllListeners('unblocked')
      this.connection.removeAllListeners('error')
      this.connection.removeAllListeners('close')
      this.connection = false
      this.connected = false
      this.channel = false
      this.channels = []
      this.assertedQueuesMapping = {}
      this.assertedExchangesMapping = {}

      // Reconnect if the connection closes, but not in case when we forced it to leave closed.
      if (!this.forceDisconnect) {
        this._resetConnectorPromise()
      }
    }

    this.emit('disconnected', { forceDisconnect: this.forceDisconnect })
  }

  /**
   * @description Creates new amqp channel.
   * @returns {Promise<object>}
   */
  async createChannel () {
    logger.info('[AMQP] Creating new channel')

    if (!this.connection) {
      throw new Error('No connection')
    }

    const newChannel = await (this.connection.createChannel() as any as Promise<Channel>)

    newChannel.responseEmitter = new EventEmitter()
    newChannel.responseEmitter.setMaxListeners(0)

    logger.info('[AMQP] Created new channel')

    this.channels.push(newChannel)

    return newChannel
  }

  /**
   * @description Connect to amqp.
   * @param {String} [URL]
   * @param {ConnectOptions} [options={}]
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line max-statements
  async connect (URL, options = {}) {
    this.amqpUrl = URL || this.amqpUrl
    this.amqpUrlMasked = this.amqpUrl
    this.connectOptions = options || this.connectOptions
    logger.info(`[AMQP] Trying to connect ${this.amqpUrlMasked}`)

    try {
      const _options = {
        ...this.connectOptions,
        heartbeat: 5,
        noDelay: true,
      }
      this.connection = await amqp.connect(this.amqpUrl, _options)
      this.connected = true
      logger.info(`[AMQP] Connected ${this.amqpUrlMasked}`)

      logger.info('[AMQP] Creating default channel')

      this.channel = await this.connection.createChannel()
      this.connection.on('error', this._onError)
      this.connection.on('close', this._onClose.bind(this))

      this.channel.responseEmitter = new EventEmitter()
      this.channel.responseEmitter.setMaxListeners(0)
      this.channel.consume('amq.rabbitmq.reply-to',
        (msg) => {
          this.channel.responseEmitter.emit(msg.properties.correlationId, msg)
        },
        { noAck: true })

      this.emit('connected')

      logger.info('[AMQP] Created default channel')
    } catch (error) {
      this.connection = false
      this.connected = false
      this.channel = false
      this.channels = []
      this.assertedQueuesMapping = {}
      this.assertedExchangesMapping = {}
      logger.error(`[AMQP] Failed to connect to ${this.amqpUrlMasked}`, error)
    }
  }

  /**
   * @description Connect to amqp.
   * @param {String} [URL]
   * @param {ConnectOptions} [options={}]
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line max-statements
  async tryConnect (URL?: string, options = {}) {
    while (!this.connected) {
      await this.connect(URL, options)

      if (!this.connected) {
        const reconnectAfter = getReconnectInterval()
        await sleep(reconnectAfter)
        logger.error(`[AMQP] Failed to create connection to AMQP, sleeping ${reconnectAfter}ms`)
      }
    }
  }

  /**
   * @description Disconnects from amqp.
   * @returns {Promise<void>}
   */
  async disconnect () {
    this.forceDisconnect = true
    if (this.channel) {
      await this.channel.close()
    }

    await Promise.all(this.channels.map((_channel) => _channel.close()))

    if (this.connection) {
      await this.connection.close()
    }

    this.connection = false
    this.connected = false
    this.channel = false
    this.channels = []
    this.assertedQueuesMapping = {}
    this.assertedExchangesMapping = {}

    this.emit('disconnected', { forceDisconnect: this.forceDisconnect })

    logger.info('[AMQP] Disconnected')
  }

  /**
   * @description Assert queue if was not asseted before.
   * @param {string} queue
   * @param {PublishOptions} [options={}]
   * @returns {Promise<void>}
   */
  async assertQueueWithDefaultChannel (queue, options: PublishOptions = {}) {
    if (!this.assertedQueuesMapping[queue]) {
      logger.debug(`[AMQP] Asserting queue ${queue}`, { options })
      await this.channel.assertQueue(queue, { durable: options.durable || false })
      this.assertedQueuesMapping[queue] = true
    }
  }

  /**
   * @description Assert queue if was not asseted before.
   * @param {string} queue
   * @param {PublishOptions} [options={}]
   * @returns {Promise<void>}
   */
  async assertQueue (
    channel: Channel,
    queue: string,
    options: PublishOptions = {},
  ) {
    if (this.assertedQueuesMapping[queue]) {
      logger.debug(`[AMQP] Skipping assert queue ${queue}`)
    } else {
      logger.debug(`[AMQP] Asserting queue ${queue}`, { options })

      await channel.assertQueue(
        queue,
        {
          durable: options.durable || false,
        },
      )

      this.assertedQueuesMapping[queue] = true
    }
  }

  async assertExchangeWithDefaultChannel (
    exchange: string,
    options: AssertExchangeOptions,
  ) {
    if (this.assertedExchangesMapping[exchange]) {
      logger.debug(`[AMQP] Skipping assert exchange ${exchange}`)
    } else {
      logger.debug(`[AMQP] Asserting exchange ${exchange}`, { options })

      await this.channel.assertExchange(
        exchange,
        'fanout',
        {
          durable: options.durable || false,
        },
      )

      this.assertedExchangesMapping[exchange] = true
    }

    // if (this.assertedExchangesMapping[exchange]) {
    //   logger.debug(`[AMQP] Skipping assert exchange ${exchange}`)
    // } else {
    //   logger.debug(`[AMQP] Asserting exchange ${exchange}`)
    //   await channel.assertExchange(exchange,
    //     'fanout',
    //     { durable: options.durable || false })

    //   this.assertedExchangesMapping[exchange] = true
    // }
  }

  async assertExchange (
    channel: Channel,
    exchange: string,
    options: AssertExchangeOptions,
  ) {
    if (this.assertedExchangesMapping[exchange]) {
      logger.debug(`[AMQP] Skipping assert exchange ${exchange}`)
    } else {
      logger.debug(`[AMQP] Asserting exchange ${exchange}`)
      await channel.assertExchange(exchange,
        'fanout',
        { durable: options.durable || false })

      this.assertedExchangesMapping[exchange] = true
    }
  }
}

export default new AmqpConnector()
