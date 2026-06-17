import { Request, Response, NextFunction } from 'express'
import AMQP from '@multiplayer/amqp'
import mongo from '@multiplayer/mongo'
import { redisPubClient, redisSubClient } from '../../socketio'
import { kafkaProducer } from '../../kafka'
import redis from '@multiplayer/redis'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({
      messageQueue: AMQP.ping(),
      mongodb: mongo.connected(),
      redisPubClient: await redis.ping(redisPubClient),
      redisSubClient: await redis.ping(redisSubClient),
      kafka: kafkaProducer.isConnected(),
    })
  } catch (err) {
    return next(err)
  }
}
