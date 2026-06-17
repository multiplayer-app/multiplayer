import passport from 'passport'
import type { Request, Response, NextFunction } from 'express'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refUser = req.query.refUser as string | undefined
    const linkToUserId = req.query.linkToUserId as string | undefined
    const redirectUrl = (req.query.redirectUrl as string | undefined) || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}`

    const state = {
      refUser,
      linkToUserId,
      redirectUrl,
    }
    passport.authenticate(
      'github',
      {
        state: state as any,
      },
      () => { },
    )(req, res)
  } catch (err) {
    next(err)
  }
}
