import { Request, Response, NextFunction } from 'express'
import AMQP from '@multiplayer/amqp'
import mongo from '@multiplayer/mongo'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({
      messageQueue: AMQP.ping(),
      mongodb: mongo.connected(),
    })
  } catch (err) {
    return next(err)
  }
}
