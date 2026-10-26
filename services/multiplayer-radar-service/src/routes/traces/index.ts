import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import resolve from './resolve'

const { Router } = express
const router = Router({ mergeParams: true })
const { TraceValidationMiddleware } = ValidationMiddleware

// Issues are only found through the sessions a trace is in, so session access covers them
router.route('/:traceId').get(
  TraceValidationMiddleware.validateResolveTrace,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.READ,
  }),
  resolve,
)

export default router
