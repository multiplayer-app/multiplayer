import { Request, Response, NextFunction } from 'express'
import { UserModel, TokenModel } from '@multiplayer/models'
import { TokenTypeEnum } from '@multiplayer/types'
import AMQP from '@multiplayer/amqp'
import { AMQP_NOTIFICATION_QUEUE } from '../../config'

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

    await AMQP.publish(
      AMQP_NOTIFICATION_QUEUE,
      {
        variables: {
          template: 'CONFIRM_EMAIL',
          email: user.primaryEmail,
          data: {
            token: confirmEmailToken.token,
            user: user,
          },
        },
      },
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
