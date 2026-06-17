import amqp from 'amqplib'
import EventEmitter from 'events'

export interface Channel extends amqp.Channel {
  responseEmitter: EventEmitter
}
