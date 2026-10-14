import { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { UserModel, TokenModel } from '@multiplayer/models'
import { ErrorMessage, TokenTypeEnum } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = req

    const confirmEmailToken = await TokenModel.findByToken(body.token)

    if (
      !confirmEmailToken
      || confirmEmailToken.type !== TokenTypeEnum.CONFIRM_EMAIL
      || !confirmEmailToken.user
    ) {
      throw new InvalidArgumentError(ErrorMessage.INVALID_TOKEN)
    }

    await UserModel.confirmLocalEmail(confirmEmailToken.user as string)

    await TokenModel.deleteAllTokensForUser(
      confirmEmailToken.user as string,
      TokenTypeEnum.CONFIRM_EMAIL,
    )

    const user = await UserModel.findUserById(confirmEmailToken.user as string)

    if (!user) {
      throw new InvalidArgumentError(ErrorMessage.INVALID_TOKEN)
    }

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
