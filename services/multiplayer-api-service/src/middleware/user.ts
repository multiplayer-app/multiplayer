import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError } from 'restify-errors'
import { UserModel } from '@multiplayer/models'
import { ErrorMessage } from '@multiplayer/types'

export const validateProfileLinkingUser = (req: Request, res: Response, next: NextFunction) => {
  try {
    let { linkToUserId } = req.query

    if (!linkToUserId) {
      linkToUserId = req?.oauthState?.linkToUserId
    }

    if (
      linkToUserId
      && !req.session.users?.find(userId => userId === (linkToUserId as string))
    ) {
      throw new UnauthorizedError(ErrorMessage.NOT_AUTHORIZED)
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export const attachCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.session.current

    const user = await UserModel.findUserById(currentUserId)

    if (!user) {
      throw new UnauthorizedError('ERR_NOT_AUTHORIZED')
    }

    req.user = user

    return next()
  } catch (error) {
    return next(error)
  }
}
