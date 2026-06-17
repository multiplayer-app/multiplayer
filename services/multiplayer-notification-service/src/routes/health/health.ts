import { Request, Response, NextFunction } from 'express'
import AMQP from '@multiplayer/amqp'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({
      messageQueue: AMQP.ping(),
    })
  } catch (err) {
    return next(err)
  }
}
