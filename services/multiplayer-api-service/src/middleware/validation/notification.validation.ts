import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { NotificationSchema } from './schema'

export const validateCreateNotification = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    NotificationSchema.createNotificationSchema,
    {},
    next,
  )
}
