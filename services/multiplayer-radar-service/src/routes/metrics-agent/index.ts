import express from 'express'
import { corsMiddleware } from '@multiplayer/util'
import {
  authorize,
  Config as AuthConfig,
} from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import createGauge from './create-gauge'

const { Router } = express
const router = Router({ mergeParams: true })
const { MetricsAgentValidationMiddleware } = ValidationMiddleware

router.use(
  corsMiddleware({
    corsDomain: true,
    allowedHeaders: [
      AuthConfig.AUTH_HEADER_NAME,
      AuthConfig.CURRENT_USER_HEADER_NAME,
      AuthConfig.OAUTH_HEADER_NAME,
    ],
    credentials: true,
  }),
)

router.route('/gauge').post(
  authorize(),
  MetricsAgentValidationMiddleware.validateCreateGaugeMetrics,
  createGauge,
)

export default router
