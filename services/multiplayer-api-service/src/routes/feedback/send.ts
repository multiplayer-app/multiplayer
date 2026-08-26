import type { Request, Response, NextFunction } from 'express'
import logger from '@multiplayer/logger'
import { UserModel } from '@multiplayer/models'
import { NotificationLib } from '../../lib'
import { SUPPORT_EMAIL } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findUserById(String(req.session?.current))
    const {
      subject,
      message,
    } = req.body

    NotificationLib.sendNotification({
      template: 'FEEDBACK',
      email: SUPPORT_EMAIL,
      data: {
        subject,
        message,
        user,
      },
    }).catch(err => logger.error(err, 'Failed to send FEEDBACK notification'))

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
