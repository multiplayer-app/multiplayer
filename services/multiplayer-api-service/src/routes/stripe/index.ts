import express from 'express'
import { authorize } from '@multiplayer/auth'
import { ValidationMiddleware } from '../../middleware'
import plansList from './plans-list'
import webhook from './webhook'

const { Router } = express
const router = Router({ mergeParams: true })
const { StripeValidationMiddleware } = ValidationMiddleware

router.route('/plans').get(
  StripeValidationMiddleware.validateListStripePlans,
  authorize(),
  plansList,
)

router.route('/webhook').post(
  webhook,
)

export default router
