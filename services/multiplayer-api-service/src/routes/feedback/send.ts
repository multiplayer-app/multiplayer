import type { Request, Response, NextFunction } from 'express'
import AMQP from '@multiplayer/amqp'
import { UserModel } from '@multiplayer/models'
import {
  AMQP_NOTIFICATION_QUEUE,
  SUPPORT_EMAIL,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserModel.findUserById(String(req.session?.current))
    const {
      subject,
      message,
    } = req.body

    await AMQP.publish(
      AMQP_NOTIFICATION_QUEUE,
      {
        variables: {
          template: 'FEEDBACK',
          email: SUPPORT_EMAIL,
          data: {
            subject,
            message,
            user,
          },
        },
      },
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
