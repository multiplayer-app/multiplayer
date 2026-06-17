import express from 'express'
import { corsMiddleware } from '@multiplayer/util'
import {
  authorize,
  Config as AuthConfig,
} from '@multiplayer/auth'
import {
  ValidationMiddleware,
  DebugSessionMiddleware,
} from '../../middleware'
import start from './start'
import stop from './stop'
import update from './update'
import cancel from './cancel'
import get from './get'
import createRrwebEvent from './rrweb-event-create'
import startFromErrorSpan from './start-from-error-span'

const { Router } = express
const router = Router({ mergeParams: true })
const { DebugSessionAgentValidationMiddleware } = ValidationMiddleware

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
  DebugSessionAgentValidationMiddleware.validateStartDebugSession,
  start,
)

router.route('/error-span/start').post(
  authorize(),
  DebugSessionAgentValidationMiddleware.validateStartDebugSessionFromErrorSpan,
  startFromErrorSpan,
)

router.route('/:debugSessionId').patch(
  authorize(),
  DebugSessionAgentValidationMiddleware.validateUpdateDebugSession,
  DebugSessionMiddleware.attachDebugSession,
  update,
)

router.route('/:debugSessionId/stop').patch(
  authorize(),
  DebugSessionAgentValidationMiddleware.validateStopDebugSession,
  DebugSessionMiddleware.attachDebugSession,
  stop,
)

router.route('/:debugSessionId').get(
  authorize(),
  DebugSessionAgentValidationMiddleware.validateGetDebugSession,
  get,
)

router.route('/:debugSessionId/cancel').delete(
  authorize(),
  DebugSessionAgentValidationMiddleware.validateCancelDebugSession,
  DebugSessionMiddleware.attachDebugSession,
  cancel,
)

router.route('/:debugSessionId/rrweb-events').post(
  authorize(),
  DebugSessionAgentValidationMiddleware.validateCreateDebugSessionRrwebEvents,
  DebugSessionMiddleware.attachDebugSession,
  createRrwebEvent,
)

export default router
