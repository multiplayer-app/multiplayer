import express from 'express'
import { authorize } from '@multiplayer/auth'
import getUserSession from './get'
import updateUserSession from './update'
import { ValidationMiddleware } from '../../middleware'

const { UserSessionValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router()

router.route('/').get(
  authorize({ onlyEnabled: false }),
  UserSessionValidationMiddleware.validateGetUserSessionArgs,
  getUserSession,
)

router.route('/').patch(
  authorize({ onlyEnabled: false }),
  UserSessionValidationMiddleware.validateUpdateUserSessionArgs,
  updateUserSession,
)

export default router
