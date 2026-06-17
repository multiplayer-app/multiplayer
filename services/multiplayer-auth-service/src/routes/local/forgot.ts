import { Request, Response, NextFunction } from 'express'
import { UserModel, TokenModel } from '@multiplayer/models'
import { TokenTypeEnum } from '@multiplayer/types'
import AMQP from '@multiplayer/amqp'
import { AMQP_NOTIFICATION_QUEUE } from '../../config'

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

    await AMQP.publish(
      AMQP_NOTIFICATION_QUEUE,
      {
        variables: {
          template: 'RESET_PASSWORD',
          email: user?.profiles?.local?.email,
          data: {
            token: resetPasswordToken.token,
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
