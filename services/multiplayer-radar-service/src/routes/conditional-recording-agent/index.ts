import express from 'express'
import { corsMiddleware } from '@multiplayer/util'
import {
  authorize,
  Config as AuthConfig,
} from '@multiplayer/auth'
import { ValidationMiddleware } from '../../middleware'
import check from './check'

const { Router } = express
const router = Router({ mergeParams: true })
const { ConditionalRecordingAgentValidationMiddleware } = ValidationMiddleware

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

router.route('/check').post(
  authorize(),
  ConditionalRecordingAgentValidationMiddleware.validateCheckStartConditionalRecording,
  check,
)

export default router
