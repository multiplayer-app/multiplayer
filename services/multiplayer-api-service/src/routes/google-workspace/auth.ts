import type { Request, Response, NextFunction } from 'express'
import { CodeChallengeMethod } from 'google-auth-library'
import base64url from 'base64url'
import * as crypto from 'crypto'
import { OAuthStateCache } from '../../cache'
import { GoogleAuth } from '../../lib'
import {
  FRONTEND_DOMAIN,
  FRONTEND_PROTOCOL,
} from '../../config'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req.query.workspace as string
    const redirectUrl = (req.query.redirectUrl as string | undefined) || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}`

    const state = await OAuthStateCache.set({
      workspace,
      redirectUrl,
    })

    const challenge = base64url(crypto.createHash('sha256').update(state.code_verifier as string).digest())

    const authUrl = GoogleAuth.getAuthUrl(
      state._id,
      {
        codeChallenge: challenge,
        codeChallengeMethod: CodeChallengeMethod.S256,
      },
    )

    return res.redirect(authUrl)
  } catch (err) {
    return next(err)
  }
}
