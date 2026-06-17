import { Router } from 'express'
import { ValidationMiddleware } from '../../middleware'
import apply from './apply'
import get from './get'
import { authorize } from '@multiplayer/auth'

const { TokenValidationMiddleware } = ValidationMiddleware

const router = Router({ mergeParams: true })

router.route('/apply').post(
  TokenValidationMiddleware.validateApplyToken,
  authorize({ onlyEnabled: false }),
  apply,
)

router.route('/:token').get(
  TokenValidationMiddleware.validateGetToken,
  get,
)

export default router
