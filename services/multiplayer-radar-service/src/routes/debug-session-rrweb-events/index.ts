import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  DebugSessionMiddleware,
} from '../../middleware'
import list from './list'

const { Router } = express
const router = Router({ mergeParams: true })
const { DebugSessioRrwebEventsValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.READ,
  }),
  DebugSessioRrwebEventsValidationMiddleware.validateListDebugSessionRrwebEvents,
  DebugSessionMiddleware.attachDebugSession,
  list,
)

export default router
