import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import list from './list'
import get from './get'

const { Router } = express
const router = Router({ mergeParams: true })
const {
  AgentValidationMiddleware,
} = ValidationMiddleware

router.route('/').get(
  AgentValidationMiddleware.validateListAgents,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/:agentId').get(
  AgentValidationMiddleware.validateGetAgent,
  authorize({
    entity: RoleProjectPermissionEntity.AGENT,
    action: RoleAccessAction.READ,
  }),
  get,
)

export default router
