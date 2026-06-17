import express from 'express'
import { authorize } from '@multiplayer/auth'
import auth from './auth'
import {
  customRedirect,
  githubCallback,
  githubAuthCallbackErrorHandler,
} from './callback'
import unlink from './unlink'
import {
  ValidationMiddleware,
  UserMiddleware,
} from '../../middleware'

const { Router } = express
const router = Router()

const { AuthenticationValidationMiddleware } = ValidationMiddleware

router.route('/auth').get(
  AuthenticationValidationMiddleware.validateGithubAuthenticationArgs,
  UserMiddleware.validateProfileLinkingUser,
  auth,
)

router.route('/callback').get(
  UserMiddleware.validateProfileLinkingUser,
  githubCallback,
  customRedirect,
  githubAuthCallbackErrorHandler,
)

router.route('/unlink').patch(
  authorize(),
  AuthenticationValidationMiddleware.validateUnlinkGithubAccountArgs,
  UserMiddleware.attachCurrentUser,
  unlink,
)

export default router
