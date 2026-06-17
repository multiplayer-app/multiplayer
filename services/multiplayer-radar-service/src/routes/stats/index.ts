import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import get from './get'

const { StatsValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  StatsValidationMiddleware.validateGetStats,
  authorize({
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    action: RoleAccessAction.READ,
  }),
  get,
)

export default router
