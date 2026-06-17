import express from 'express'
import login from './login'
import forgot from './forgot'
import register from './register'
import setPassword from './set-password'
import confirmEmail from './confirm-email'
import resendConfirmEmail from './resend-confirm-email'
import { ValidationMiddleware } from '../../middleware'

const { AuthenticationValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router()

router.route('/login').post(
  AuthenticationValidationMiddleware.validateLocalLoginAuthenticationArgs,
  login,
)

router.route('/register').post(
  AuthenticationValidationMiddleware.validateLocalRegisterArgs,
  register,
)

router.route('/forgot').post(
  AuthenticationValidationMiddleware.validateLocalForgotArgs,
  forgot,
)

router.route('/set-password').post(
  AuthenticationValidationMiddleware.validateLocalSetPasswordArgs,
  setPassword,
)

router.route('/confirm-email').post(
  AuthenticationValidationMiddleware.validateConfirmLocalEmailArgs,
  confirmEmail,
)

router.route('/resend-confirm-email').post(
  AuthenticationValidationMiddleware.validateResendConfirmLocalEmailArgs,
  resendConfirmEmail,
)

export default router
