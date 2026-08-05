import type { Request, Response, NextFunction } from 'express'
import { NotificationLib } from '../../lib'
import { MARKETING_EMAIL } from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      email,
      company,
      phone,
      message,
    } = req.body

    await NotificationLib.sendNotification({
      template: 'CONTACT_FORM',
      email: MARKETING_EMAIL,
      data: {
        name,
        email,
        company,
        phone,
        message,
      },
    })

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
