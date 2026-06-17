import express from 'express'
import { authorize } from '@multiplayer/auth'
import auth from './auth'
import {
  customRedirect,
  googleCallback,
  googleAuthCallbackErrorHandler,
} from './callback'
import unlink from './unlink'
import {
  ValidationMiddleware,
  UserMiddleware,
} from '../../middleware'

const { AuthenticationValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router()

router.route('/auth').get(
  AuthenticationValidationMiddleware.validateGoogleAuthenticationArgs,
  UserMiddleware.validateProfileLinkingUser,
  auth,
)

router.route('/callback').get(
  UserMiddleware.validateProfileLinkingUser,
  googleCallback,
  customRedirect,
  googleAuthCallbackErrorHandler,
)

router.route('/unlink').patch(
  AuthenticationValidationMiddleware.validateUnlinkGoogleAccountArgs,
  authorize(),
  UserMiddleware.attachCurrentUser,
  unlink,
)

export default router
