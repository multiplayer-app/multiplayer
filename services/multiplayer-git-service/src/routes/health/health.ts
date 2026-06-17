import type { Request, Response, NextFunction } from 'express'
import mongo from '@multiplayer/mongo'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({
      mongodb: mongo.connected(),
    })
  } catch (err) {
    return next(err)
  }
}
