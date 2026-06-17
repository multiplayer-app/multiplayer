import passport from 'passport'
import type { Request, Response, NextFunction } from 'express'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req.query.workspace as string | undefined
    const redirectUrl = (req.query.redirectUrl as string | undefined) || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}/dashboard/${workspace}/settings/integrations`

    const state = {
      workspace,
      redirectUrl,
    }

    passport.authenticate(
      'gitlab',
      {
        state: state as any,
      },
    )(req, res)
  } catch (err) {
    next(err)
  }
}
