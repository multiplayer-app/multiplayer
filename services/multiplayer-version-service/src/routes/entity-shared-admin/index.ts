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
const { EntityShareAdminValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.READ_ACCESS,
  }),
  EntityShareAdminValidationMiddleware.validateListAllSharedEntitiesInProject,
  list,
)

export default router
