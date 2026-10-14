import type { Request, Response, NextFunction } from 'express'
import { SendNotificationMessage } from '@multiplayer/types'
import { NotificationLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    await NotificationLib.sendNotification(req.body as SendNotificationMessage['variables'])

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
