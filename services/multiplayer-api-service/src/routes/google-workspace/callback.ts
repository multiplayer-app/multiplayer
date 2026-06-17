import type { Request, Response, NextFunction } from 'express'
import logger from '@multiplayer/logger'
import { NotFoundError } from 'restify-errors'
import { WorkspaceUserModel } from '@multiplayer/models'
import { URL } from 'node:url'
import { OAuthStateCache } from '../../cache'
import { GoogleAuth } from '../../lib'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export const callback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = String(req.session.current)
    const code = req.query.code as string
    const oauthState = req.oauthState

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
      userId,
      (oauthState as any).workspace as string,
    )

    if (!workspaceUser) {
      throw new NotFoundError('Workspace-user not found')
    }

    const oAuth2Client = GoogleAuth.getOAuth2Client()
    const tokenResponse = await oAuth2Client.getToken({
      code,
      codeVerifier: oauthState.code_verifier,
    })

    await WorkspaceUserModel.updateWorkspaceUser(
      workspaceUser.user,
      workspaceUser.workspace,
      {
        googleWorkspaceToken: tokenResponse.tokens,
      },
    )

    return next()
  } catch (err) {
    logger.error(err)
    return next(err)
  }
}

export const customRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthState = req.oauthState

    await OAuthStateCache.remove(oauthState._id)

    return res.redirect(oauthState.redirectUrl)
  } catch (err) {
    return next(err)
  }
}

export const errorHandler = async (error: Error, req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthState = req.oauthState
    const { message } = error

    let redirectUrl = oauthState?.redirectUrl || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}`


    if (oauthState?._id) {
      await OAuthStateCache.remove(oauthState._id)
    }

    const parsedUrl = new URL(redirectUrl)

    if (parsedUrl?.search?.length || redirectUrl.endsWith('?')) {
      redirectUrl += '&'
    } else {
      redirectUrl += '?'
    }

    redirectUrl += `message=${message}`

    return res.redirect(redirectUrl)
  } catch (err) {
    return next(err)
  }
}
