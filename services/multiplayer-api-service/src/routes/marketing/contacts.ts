import type { Request, Response, NextFunction } from 'express'
import AMQP from '@multiplayer/amqp'
import {
  AMQP_NOTIFICATION_QUEUE,
  MARKETING_EMAIL,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      company,
      phone,
      message,
    } = req.body

    await AMQP.publish(
      AMQP_NOTIFICATION_QUEUE,
      {
        variables: {
          template: 'CONTACT_FORM',
          email: MARKETING_EMAIL,
          data: {
            name,
            email,
            company,
            phone,
            message,
          },
        },
      },
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
