import express from 'express'
import { authorize } from '@multiplayer/auth'
import auth from './auth'
import {
  customRedirect,
  gitlabCallback,
  gitlabAuthCallbackErrorHandler,
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
  AuthenticationValidationMiddleware.validateGitlabAuthenticationArgs,
  UserMiddleware.validateProfileLinkingUser,
  auth,
)

router.route('/callback').get(
  UserMiddleware.validateProfileLinkingUser,
  gitlabCallback,
  customRedirect,
  gitlabAuthCallbackErrorHandler,
)

router.route('/unlink').patch(
  authorize(),
  AuthenticationValidationMiddleware.validateUnlinkGitlabAccountArgs,
  UserMiddleware.attachCurrentUser,
  unlink,
)

export default router
