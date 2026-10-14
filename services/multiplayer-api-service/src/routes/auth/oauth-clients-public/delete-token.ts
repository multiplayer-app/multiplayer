import { NextFunction, Request, Response } from 'express'
import { TokenModel } from '@multiplayer/models'
import { UnauthorizedError } from 'restify-errors'
import { RandomToken } from '@multiplayer/util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.body.token as string
    if (!token) {
      throw new UnauthorizedError('No token provided')
    }
    const [, accessToken] = token.split(' ')
    await TokenModel.deleteByToken(RandomToken.hashToken(accessToken))
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
