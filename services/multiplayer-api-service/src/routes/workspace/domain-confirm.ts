import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { TokenModel, WorkspaceModel } from '@multiplayer/models'
import { ErrorMessage, TokenTypeEnum } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body

    const token = await TokenModel.findByToken(code)

    if (!token || token.type !== TokenTypeEnum.VERIFY_DOMAIN) {
      throw new InvalidArgumentError(ErrorMessage.INVALID_TOKEN)
    }

    const workspace = await WorkspaceModel.addDomain(
      token?.meta?.workspace as string,
      token?.meta?.domain as string,
    )

    await TokenModel.deleteAllTokensForUser(
      token.user as string,
      TokenTypeEnum.VERIFY_DOMAIN,
    )

    return res.status(200).json(workspace)
  } catch (err) {
    return next(err)
  }
}
