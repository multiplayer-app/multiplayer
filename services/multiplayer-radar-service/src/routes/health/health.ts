import type { Request, Response, NextFunction } from 'express'
import mongo from '@multiplayer/mongo'
import { Store } from '../../store'
import { kafkaConsumer } from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({
      mongodb: mongo.connected(),
      clickhouse: await Store.connected(),
      kafka: await kafkaConsumer.isConnected(),
    })
  } catch (err) {
    return next(err)
  }
}
