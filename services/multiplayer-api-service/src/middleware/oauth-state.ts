import { Request, Response, NextFunction } from 'express'
import { InvalidCredentialsError } from 'restify-errors'
import { OAuthStateCache } from '../cache'

export const attachOAuthState = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stateId = req.query.state as string

    const oauthState = await OAuthStateCache.get(stateId)

    if (!oauthState) {
      throw new InvalidCredentialsError('Invalid state')
    }

    req.oauthState = oauthState

    return next()
  } catch (error) {
    return next(error)
  }
}
