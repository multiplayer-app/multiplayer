import AMQP from '@multiplayer/amqp'
import {
  AMQP_EVENT_QUEUE,
  AMQP_INTEGRATION_EVENT_QUEUE,
} from './config'
import { AmqpEventListener } from './listener'

export async function connectAMQP() {
  await AMQP.connect()
  await AMQP.bindQueue(
    AMQP_INTEGRATION_EVENT_QUEUE,
    AMQP_EVENT_QUEUE,
    { durable: true },
  )

  await AMQP.listen(
    AMQP_INTEGRATION_EVENT_QUEUE,
    AmqpEventListener,
    {
      durable: true,
      prefetch: 3,
    },
  )
}
