import type { Request, Response, NextFunction } from 'express'
import { IntegrationModel, WorkspaceUserModel } from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
  OAuthState,
} from '@multiplayer/types'
import { URL } from 'node:url'
import logger from '@multiplayer/logger'
import passport from '../../passport'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export const callback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?._id?.toString() as string

    const {
      error,
      error_description,
    } = req.query

    const callback = async (cbError: Error, bitbucketData: any, state: { state: OAuthState }) => {
      try {
        req.oauthState = state.state

        if (cbError) {
          logger.error(cbError, 'Failed to create bitbucket integration.')
          return next(cbError)
        }

        if (error || error_description) {
          throw new Error((error_description || error) as string)
        }

        if (!bitbucketData.accessToken) {
          throw new Error('Failed to get access token')
        }

        const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
          userId,
          req.oauthState.workspace as string,
        )

        await IntegrationModel.createIntegration({
          workspace: req.oauthState.workspace,
          type: IntegrationTypeEnum.BITBUCKET,
          authType: IntegrationAuthTypeEnum.OAUTH,
          workspaceUser: workspaceUser?._id,
          bitbucket: {
            integrationSettingsUrl: 'https://bitbucket.org/account/settings/app-authorizations/',
            accessToken: bitbucketData.accessToken,
            refreshToken: bitbucketData.refreshToken,
          },
        })

        return next()
      } catch (cbErr: any) {
        return next(cbErr)
      }
    }

    passport.authenticate(
      'bitbucket',
      {},
      callback,
    )(req, res, next)
  } catch (err) {
    return next(err)
  }
}

export const customRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthState = req.oauthState

    const redirectUrl = oauthState?.redirectUrl || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}`

    return res.redirect(redirectUrl)
  } catch (err) {
    return next(err)
  }
}

export const callbackErrorHandler = async (error: Error, req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthState = req.oauthState
    const { message } = error

    logger.error(error, '[BITBUCKET] OAuth2 callback error')

    let redirectUrl = oauthState?.redirectUrl || `${FRONTEND_PROTOCOL}://${FRONTEND_DOMAIN}`

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
