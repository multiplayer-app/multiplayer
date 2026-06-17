import express from 'express'
import { ValidationMiddleware } from '../../middleware'
import get from './get'
import auth from './authorize'
import { authorize } from '@multiplayer/auth'

const { AuthenticationValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router()

router.route('/:clientId').get(
  AuthenticationValidationMiddleware.validatePrivateGetOauthClient,
  get,
)

router.route('/:clientId/authorize').post(
  authorize({ onlyEnabled: true }),
  AuthenticationValidationMiddleware.validateGenerateAuthCode,
  auth,
)

export default router
