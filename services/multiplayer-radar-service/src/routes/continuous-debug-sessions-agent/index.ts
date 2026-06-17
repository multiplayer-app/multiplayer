import express from 'express'
import { corsMiddleware } from '@multiplayer/util'
import {
  authorize,
  Config as AuthConfig,
} from '@multiplayer/auth'
import {
  ValidationMiddleware,
} from '../../middleware'
import start from './start'
import cancel from './cancel'
import save from './save'
import get from './get'

const { Router } = express
const router = Router({ mergeParams: true })
const { ContinuousDebugSessionAgentValidationMiddleware } = ValidationMiddleware

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

router.route('/start').post(
  authorize(),
  ContinuousDebugSessionAgentValidationMiddleware.validateStartContinuousDebugSession,
  start,
)

router.route('/:continuousDebugSessionId/cancel').delete(
  authorize(),
  ContinuousDebugSessionAgentValidationMiddleware.validateCancelContinuousDebugSession,
  cancel,
)

router.route('/:continuousDebugSessionId').get(
  authorize(),
  ContinuousDebugSessionAgentValidationMiddleware.validateGetContinuousDebugSession,
  get,
)

router.route('/:continuousDebugSessionId/save').post(
  authorize(),
  ContinuousDebugSessionAgentValidationMiddleware.validateSaveContinuousDebugSession,
  save,
)

export default router
