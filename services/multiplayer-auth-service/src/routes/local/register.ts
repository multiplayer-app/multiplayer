import { Request, Response, NextFunction } from 'express'
import { UserModel, TokenModel, IUserDocument } from '@multiplayer/models'
import { TokenTypeEnum } from '@multiplayer/types'
import AMQP from '@multiplayer/amqp'
import { autoAddWorkspace } from '../../util'
import { AMQP_NOTIFICATION_QUEUE } from '../../config'
import { EmailService } from '../../service'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body

    let user = await UserModel.findByPrimaryEmail(payload.email)

    if (
      user
      && user?.profiles?.local?.email
      && user?.profiles?.local?.passwordHash
      && user?.profiles?.local?.isEmailConfirmed
    ) {
      return res.sendStatus(204)
    }

    if (!user) {
      // const username = payload.username || payload.email.split('@')[0]

      user = await UserModel.createByLocalEmail(
        payload.email,
        payload.password,
        {
          firstName: payload.firstName,
          lastName: payload.lastName,
          invite: {
            refUser: payload.refUser,
          },
        },
      )

      await EmailService.sendOnboardingEmails(user)

      await autoAddWorkspace(user)
    } else if (!user?.profiles?.local?.email) {
      user = await UserModel.addLocalProfile(
        user._id,
        payload.email,
        payload.password,
        user?.profiles?.local?.isEmailConfirmed,
      ) as IUserDocument
    }

    const confirmEmailToken = await TokenModel.createToken(
      TokenTypeEnum.CONFIRM_EMAIL,
      user._id,
    )

    if (!user?.profiles?.local?.isEmailConfirmed) {
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
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
