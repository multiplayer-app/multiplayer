import { Request, Response, NextFunction } from 'express'
import { UserModel } from '@multiplayer/models'
import { AuthType, ErrorMessage } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.query

    const user = await UserModel.findByLocalEmail(email as string)

    if (!user) {
      throw new NotFoundError(ErrorMessage.USER_NOT_FOUND)
    }

    const data = {
      authType: AuthType.LOCAL,
    }

    return res.status(200).json(data)
  } catch (err) {
    return next(err)
  }
}
