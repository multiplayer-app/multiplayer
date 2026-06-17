import type { Request, Response, NextFunction } from 'express'
import mongo from '@multiplayer/mongo'
import * as clickhouse from '@multiplayer/clickhouse'
import { kafkaConsumer } from '../../libs'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({
      mongodb: mongo.connected(),
      clickhouse: await clickhouse.connected(),
      kafka: await kafkaConsumer.isConnected(),
    })
  } catch (err) {
    return next(err)
  }
}
