import logger from '@multiplayer/logger'
import connector from './connector'
import type { BindOptions } from './types'

export default async (
  queue: string,
  exchange: string,
  options: BindOptions,
): Promise<void> => {
  await connector.connectPromise
  const channel = connector.channel

  await connector.assertExchange(channel, exchange, options)
  await connector.assertQueue(channel, queue, options)

  await channel.bindQueue(queue, exchange, '')

  logger.info(`[AMQP] Binded queue ${queue} to exchange ${exchange}`)
}
