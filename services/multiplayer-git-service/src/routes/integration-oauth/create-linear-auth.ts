import type { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'
import base64url from 'base64url'
import { OAuthStateCache } from '../../cache'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
  LINEAR_APP_ID,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req.query.workspace as string | undefined
    const redirectUrl = (req.query.redirectUrl as string | undefined) || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}/dashboard/${workspace}/settings/integrations`

    const state = {
      workspace,
      redirectUrl,
    }

    const oauthState = await OAuthStateCache.set(state)

    const pkceMethod = 'S256'

    const challenge = base64url(crypto.createHash('sha256').update(oauthState.code_verifier as string).digest())

    const callbackUrl = `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/linear/callback`

    const authRedirectUrl = `https://linear.app/oauth/authorize?client_id=${LINEAR_APP_ID}&redirect_uri=${callbackUrl}&response_type=code&scope=write&state=${oauthState._id}&code_challenge=${challenge}&code_challenge_method=${pkceMethod}`

    return res.redirect(authRedirectUrl)
  } catch (err) {
    return next(err)
  }
}
