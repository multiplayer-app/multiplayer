import type { Request, Response, NextFunction } from 'express'
import AMQP from '@multiplayer/amqp'
import mongo from '@multiplayer/mongo'
import { kafkaConsumer } from '../../kafka'
import redis from '@multiplayer/redis'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({
      messageQueue: AMQP.ping(),
      mongodb: mongo.connected(),
      kafka: await kafkaConsumer.isConnected(),
      redis: await redis.ping(),
    })
  } catch (err) {
    return next(err)
  }
}
