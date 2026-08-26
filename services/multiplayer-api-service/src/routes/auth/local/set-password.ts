import { Request, Response, NextFunction } from 'express'
import { UserModel, TokenModel } from '@multiplayer/models'
import { ErrorMessage, TokenTypeEnum } from '@multiplayer/types'
import { InvalidArgumentError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req

    const resetPasswordToken = await TokenModel.findByToken(body.token)

    if (!resetPasswordToken || resetPasswordToken.type !== TokenTypeEnum.RESET_PASSWORD) {
      throw new InvalidArgumentError(ErrorMessage.INVALID_TOKEN)
    }

    const user = await UserModel.findUserById(resetPasswordToken.user as string)

    if (!user) {
      throw new InvalidArgumentError(ErrorMessage.INVALID_TOKEN)
    }

    await user.setLocalPassword(body.password)

    await TokenModel.deleteAllTokensForUser(
      user._id,
      TokenTypeEnum.RESET_PASSWORD,
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
