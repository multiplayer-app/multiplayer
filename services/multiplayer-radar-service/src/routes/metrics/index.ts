import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import get from './get'

const { Router } = express
const router = Router({ mergeParams: true })
const { MetricsValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  MetricsValidationMiddleware.validateGetMetrics,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  get,
)

export default router
