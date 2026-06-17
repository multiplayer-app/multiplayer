import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  ProjectMiddleware,
  WorkspaceMiddleware,
} from '../../middleware'
import list from './list'
import get from './get'
import create from './create'
import update from './update'
import remove from './delete'

const { Router } = express
const router = Router({ mergeParams: true })
const { ThreadValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  ThreadValidationMiddleware.validateListThreads,
  authorize({
    entity: RoleProjectPermissionEntity.THREAD,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/:threadId').get(
  ThreadValidationMiddleware.validateGetThread,
  authorize({
    entity: RoleProjectPermissionEntity.THREAD,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/').post(
  ThreadValidationMiddleware.validateCreateThread,
  authorize({
    entity: RoleProjectPermissionEntity.THREAD,
    action: RoleAccessAction.CREATE,
  }),
  WorkspaceMiddleware.attachWorkspace,
  ProjectMiddleware.attachProject,
  WorkspaceMiddleware.attachWorkspaceUser,
  create,
)

router.route('/:threadId').patch(
  ThreadValidationMiddleware.validateUpdateThread,
  authorize({
    entity: RoleProjectPermissionEntity.THREAD,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:threadId').delete(
  ThreadValidationMiddleware.validateDeleteThread,
  authorize({
    entity: RoleProjectPermissionEntity.THREAD,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

export default router
