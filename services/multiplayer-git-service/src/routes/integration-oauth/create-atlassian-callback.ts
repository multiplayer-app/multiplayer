import type { Request, Response, NextFunction } from 'express'
import { IntegrationModel, WorkspaceUserModel } from '@multiplayer/models'
import { InvalidArgumentError } from 'restify-errors'
import { URL } from 'node:url'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
  ErrorMessage,
  OAuthState,
} from '@multiplayer/types'
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

    const callback = async (cbError: Error, atlassianData: any, state: { state: OAuthState }) => {
      try {
        req.oauthState = state.state

        if (cbError) {
          logger.error(cbError, 'Failed to create atlassian integration.')
          return next(cbError)
        }

        if (error || error_description) {
          throw new Error((error_description || error) as string)
        }

        if (!atlassianData.accessToken) {
          throw new Error('Failed to get access token')
        }

        const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
          userId,
          req.oauthState.workspace as string,
        )

        if (!workspaceUser) {
          throw new InvalidArgumentError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
        }

        await IntegrationModel.createIntegration({
          workspace: req.oauthState.workspace,
          type: IntegrationTypeEnum.ATLASSIAN,
          authType: IntegrationAuthTypeEnum.OAUTH,
          workspaceUser: workspaceUser._id,
          atlassian: {
            accessToken: atlassianData.accessToken,
            refreshToken: atlassianData.refreshToken,
            email: atlassianData.profile.email,
          },
        })

        return next()
      } catch (cbErr: any) {
        return next(cbErr)
      }
    }

    passport.authenticate(
      'atlassian',
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

    logger.error(error, '[ATLASSIAN] OAuth2 callback error')

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
