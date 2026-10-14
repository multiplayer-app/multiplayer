import { Request, Response, NextFunction } from 'express'
import { UserModel, TokenModel } from '@multiplayer/models'
import { TokenTypeEnum } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { NotificationLib } from '../../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req
    const user = await UserModel.findByLocalEmail(body.email)

    if (!user) {
      return res.sendStatus(204)
    }

    const resetPasswordToken = await TokenModel.createToken(
      TokenTypeEnum.RESET_PASSWORD,
      user._id,
    )

    NotificationLib.sendNotification({
      template: 'RESET_PASSWORD',
      email: user?.profiles?.local?.email || body.email,
      data: {
        token: resetPasswordToken.token,
        user,
      },
    }).catch(err => logger.error(err, 'Failed to send RESET_PASSWORD notification'))

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
