import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
} from '../../middleware'
import list from './list'

const { Router } = express
const router = Router({ mergeParams: true })
const { PlatformsValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  PlatformsValidationMiddleware.validateListPlatforms,
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.READ,
  }),
  list,
)

export default router
