import express from 'express'
import { JwtToken } from '@multiplayer/util'
import { OauthClientModel } from '@multiplayer/models'
import { BadRequestError, UnauthorizedError } from 'restify-errors'
import { ValidationMiddleware } from '../../middleware'
import register from './register'
import get from './get'
import update from './update'
import remove from './remove'
import exchangeToken from './exchange-token'
import deleteToken from './delete-token'
import { OAUTH_JWT_SECRET } from '../../config'

const { AuthenticationValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router()

async function validateRegistrationToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const clientId = req.params.clientId as string

    if (
      !authHeader
      || !authHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedError('missing_or_invalid_token')
    }

    const token = authHeader.slice('Bearer '.length)
    if (!token) {
      throw new UnauthorizedError('missing_or_invalid_token')
    }
    const decodedToken = JwtToken.decodeJwtToken(token, OAUTH_JWT_SECRET)
    if (!decodedToken.clientId) {
      throw new UnauthorizedError('missing_or_invalid_token')
    }

    if (decodedToken.clientId !== clientId) {
      throw new BadRequestError('client ids do not match')
    }
    const client = await OauthClientModel.findOauthClientById(clientId)
    if (!client) {
      throw new UnauthorizedError('missing_or_invalid_token')
    }
    return next()
  } catch (error) {
    return next(new UnauthorizedError('missing_or_invalid_token'))
  }
}

router.route('/token').post(
  AuthenticationValidationMiddleware.validateTokenExchange,
  exchangeToken,
)
router.route('/token/revoke').post(
  AuthenticationValidationMiddleware.validateDeleteToken,
  deleteToken,
)
router.route('/').post(
  AuthenticationValidationMiddleware.validateOauthClientRegistration,
  register,
)
router.route('/:clientId').get(
  validateRegistrationToken,
  AuthenticationValidationMiddleware.validateGetOauthClient,
  get,
)
router.route('/:clientId').put(
  validateRegistrationToken,
  AuthenticationValidationMiddleware.validateUpdateOauthClient,
  update,
)
router.route('/:clientId').delete(
  validateRegistrationToken,
  AuthenticationValidationMiddleware.validateDeleteOauthClient,
  remove,
)

export default router
