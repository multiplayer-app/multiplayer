import express from 'express'
import { ValidationMiddleware } from '../../middleware'
import get from './get'

const { AuthenticationValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router()

router.route('/').get(
  AuthenticationValidationMiddleware.validateGetUserAuthTypeArgs,
  get,
)

export default router
