import { Request, Response, NextFunction } from 'express'
import { UserModel } from '@multiplayer/models'
import logger from '@multiplayer/logger'
import { ErrorMessage, OAuthState } from '@multiplayer/types'
import { URL } from 'node:url'
import {
  InvalidCredentialsError,
  InvalidArgumentError,
} from 'restify-errors'
import passport from '../../passport'
import { autoAddWorkspace } from '../../util'
import { EmailService } from '../../service'
import {
  FRONTEND_PROTOCOL,
  FRONTEND_DOMAIN,
} from '../../config'

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req?.session?.current

    const {
      error,
      error_description,
    } = req.query

    const callback = async (cbError: Error, googleProfile: any, state: { state: OAuthState }) => {
      try {
        req.oauthState = state.state

        if (cbError) {
          return next(cbError)
        }

        if (error || error_description) {
          throw new Error((error_description || error) as string)
        }

        if (!googleProfile?.id) {
          throw new Error(ErrorMessage.FAILED_TO_LOGIN)
        }

        const email = googleProfile?.emails?.[0]?.value as string
        let user

        if (req.oauthState.linkToUserId) {
          if (currentUserId.toString() !== req.oauthState.linkToUserId.toString()) {
            throw new InvalidArgumentError('Invalid linking user id.')
          }

          user = await UserModel.addGoogleProfile(req.oauthState.linkToUserId, email, googleProfile.id)

          if (!user) {
            throw new InvalidArgumentError(ErrorMessage.INVALID_LINKING_USER_ID)
          }
        } else {
          user = await UserModel.findByGoogleId(googleProfile.id)

          if (!user) {
            user = await UserModel.findByPrimaryEmail(email)

            if (user) {
              if (user.isWithoutProfile()) {
                user = await UserModel.addGoogleProfile(user._id, email, googleProfile.id)
              } else {
                throw new InvalidCredentialsError(ErrorMessage.EMAIL_ALREADY_USED)
              }
            } else {
              user = await UserModel.createByGoogleProfile(
                email,
                googleProfile.id,
                {
                  firstName: googleProfile?.name?.givenName,
                  lastName: googleProfile?.name?.familyName,
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
        logger.error(error, 'Failed to login with google')
        return next(error)
      }
    }

    passport.authenticate(
      'google',
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

export const googleAuthCallbackErrorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const oauthState = req.oauthState
    const { message } = error

    logger.error(error, '[GOOGLE] OAuth2 callback error')

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
