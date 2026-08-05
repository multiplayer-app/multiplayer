import { Request, Response, NextFunction } from 'express'
import { UserModel, TokenModel } from '@multiplayer/models'
import { TokenTypeEnum } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { NotificationLib } from '../../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body

    const user = await UserModel.findByLocalEmail(email)

    if (
      !user
      || user?.profiles?.local?.isEmailConfirmed
    ) {
      return res.sendStatus(204)
    }

    let confirmEmailToken = await TokenModel.findByTokenTypeAndUser(
      TokenTypeEnum.CONFIRM_EMAIL,
      user._id,
    )

    if (!confirmEmailToken) {
      confirmEmailToken = await TokenModel.createToken(
        TokenTypeEnum.CONFIRM_EMAIL,
        user._id,
      )
    }

    NotificationLib.sendNotification({
      template: 'CONFIRM_EMAIL',
      email: user.primaryEmail,
      data: {
        token: confirmEmailToken.token,
        user: user,
      },
    }).catch(err => logger.error(err, 'Failed to send CONFIRM_EMAIL notification'))

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
