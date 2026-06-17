import type { Request, Response, NextFunction } from 'express'
import { InvalidArgumentError } from 'restify-errors'
import { IntegrationModel, WorkspaceUserModel } from '@multiplayer/models'
import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
  ErrorMessage,
  OAuthState,
} from '@multiplayer/types'
import { URL } from 'node:url'
import logger from '@multiplayer/logger'
import passport from '../../passport'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export const callback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?._id?.toString() as string

    const {
      error,
      error_description,
    } = req.query

    const callback = async (cbError: Error, gitlabData: any, state: { state: OAuthState }) => {
      try {
        req.oauthState = state.state

        if (cbError) {
          logger.error(cbError, 'Failed to create gitlab integration.')
          return next(cbError)
        }

        if (error || error_description) {
          throw new Error((error_description || error) as string)
        }

        if (!gitlabData.accessToken) {
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
          type: IntegrationTypeEnum.GITLAB,
          authType: IntegrationAuthTypeEnum.OAUTH,
          workspaceUser: workspaceUser?._id,
          gitlab: {
            integrationSettingsUrl: 'https://gitlab.com/-/user_settings/applications',
            accessToken: gitlabData.accessToken,
            refreshToken: gitlabData.refreshToken,
          },
        })

        return next()
      } catch (cbErr: any) {
        return next(cbErr)
      }
    }

    passport.authenticate('gitlab', callback)(req, res, next)
  } catch (err) {
    return next(err)
  }
}

export const customRedirect = async (req, res, next) => {
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

    logger.error(error, '[GITLAB] OAuth2 callback error')

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
