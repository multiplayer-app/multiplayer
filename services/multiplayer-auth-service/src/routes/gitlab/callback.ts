import { Request, Response, NextFunction } from 'express'
import { UserModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import {
  ErrorMessage,
  OAuthState,
} from '@multiplayer/types'
import {
  InvalidCredentialsError,
  InvalidArgumentError,
} from 'restify-errors'
import { URL } from 'node:url'
import passport from '../../passport'
import { autoAddWorkspace } from '../../util'
import { EmailService } from '../../service'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export const gitlabCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req?.session?.current

    const {
      error,
      error_description,
    } = req.query

    const callback = async (cbError: Error, gitlabProfile: any, state: { state: OAuthState }) => {
      try {
        req.oauthState = state.state

        if (cbError) {
          return next(cbError)
        }

        if (error || error_description) {
          throw new Error((error_description || error) as string)
        }

        if (!gitlabProfile?.id) {
          return next(new Error(ErrorMessage.FAILED_TO_LOGIN))
        }

        const email = gitlabProfile?.emails?.[0]?.value as string
        let user

        if (req.oauthState.linkToUserId) {
          if (req.oauthState.linkToUserId.toString() !== currentUserId.toString()) {
            return next(new InvalidArgumentError('Invalid linking user id.'))
          }

          user = await UserModel.addGitlabProfile(
            req.oauthState.linkToUserId,
            email,
            gitlabProfile.id,
          )

          if (!user) {
            return next(new InvalidArgumentError(ErrorMessage.INVALID_LINKING_USER_ID))
          }
        } else {
          user = await UserModel.findByGitlabId(gitlabProfile.id)

          if (!user) {
            user = await UserModel.findByPrimaryEmail(email)

            if (user) {
              if (user.isWithoutProfile()) {
                user = await UserModel.addGitlabProfile(user._id, email, gitlabProfile.id)
              } else {
                return next(new InvalidCredentialsError(ErrorMessage.EMAIL_ALREADY_USED))
              }
            } else {
              const [firstName, lastName] = gitlabProfile?.displayName?.split(' ') || []

              user = await UserModel.createByGitlabProfile(
                email,
                gitlabProfile.id,
                {
                  firstName,
                  lastName,
                  invite: {
                    refUser: req.oauthState.refUser,
                  },
                },
              )

              await autoAddWorkspace(user)
            }
          }
        }

        if (!req.session.users?.find((userId) => user?._id.equals(userId))) {
          req.session.users = [
            ...(req.session.users || []),
            user?._id.toString(),
          ]
        }

        if (!user.lastLoginAt) {
          await EmailService.sendOnboardingEmails(user)
        }

        user = await UserModel.updateUserById(
          user._id,
          {
            lastLoginAt: new Date(),
          },
        )

        req.session.current = user?._id.toString()

        return next()
      } catch (error) {
        logger.error(error, 'Failed to login with gitlab')
        return next(error)
      }
    }

    passport.authenticate('gitlab', callback)(req, res, next)
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

export const gitlabAuthCallbackErrorHandler = async (error: Error, req: Request, res: Response, next: NextFunction) => {
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
