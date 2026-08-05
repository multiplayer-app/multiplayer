import type { Request, Response, NextFunction } from 'express'
import passport from '../../passport'
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
      'bitbucket',
      {
        state: state as any,
      },
    )(req, res)
  } catch (err) {
    return next(err)
  }
}
