import type { Request, Response, NextFunction } from 'express'
import { OAuth2 } from 'oauth'
import { IntegrationModel, WorkspaceUserModel } from '@multiplayer/models'
import { IntegrationTypeEnum, IntegrationAuthTypeEnum } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { URL } from 'node:url'
import { OAuthStateCache } from '../../cache'
import {
  LINEAR_APP_ID,
  LINEAR_APP_SECRET,
  API_PROTOCOL,
  API_DOMAIN,
  API_PREFIX,
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export const callback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString() as string
    const oauthState = req.oauthState

    const {
      code,
      error,
      error_description,
    } = req.query

    if (error || error_description) {
      throw new Error((error_description || error) as string)
    }

    const oauth2 = new OAuth2(
      LINEAR_APP_ID,
      LINEAR_APP_SECRET,
      'https://api.linear.app',
      undefined,
      '/oauth/token',
    )
    const callbackUrl = `${API_PROTOCOL}://${API_DOMAIN}${API_PREFIX}/integrations/linear/callback`


    const tokenResponse: { access_token: string } = await new Promise((resolve, reject) => oauth2.getOAuthAccessToken(
      code as string,
      {
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        client_id: LINEAR_APP_ID,
        client_secret: LINEAR_APP_SECRET,
      },
      (error, access_token, refresh_token, results) => {
        if (error) {
          return reject(error)
        }

        resolve({ access_token: access_token as string })
      },
    ))

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
      userId,
      oauthState.workspace as string,
    )
    await IntegrationModel.createIntegration({
      workspace: oauthState.workspace,
      type: IntegrationTypeEnum.LINEAR,
      authType: IntegrationAuthTypeEnum.OAUTH,
      workspaceUser: workspaceUser?._id,
      linear: {
        accessToken: tokenResponse.access_token,
      },
    })

    return next()
  } catch (err) {
    logger.error(err)
    return next(err)
  }
}

export const customRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthState = req.oauthState

    const redirectUrl = oauthState?.redirectUrl || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}`

    if (oauthState?._id) {
      await OAuthStateCache.remove(oauthState._id)
    }

    return res.redirect(redirectUrl)
  } catch (err) {
    return next(err)
  }
}

export const callbackErrorHandler = async (error: Error, req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthState = req.oauthState
    const { message } = error

    let redirectUrl = oauthState?.redirectUrl || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}`

    logger.error(error, '[LINEAR] OAuth2 callback error')

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
