import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import bulkUpdate from './bulk-update'
import listInWorkspace from './list-in-workspace'

const { Router } = express
const router = Router({ mergeParams: true })
const { GitRepositoryValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryValidationMiddleware.validateListGitRepositoriesInWorkspace,
  listInWorkspace,
)

router.route('/bulk').patch(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryValidationMiddleware.validateBulkUpdateGitRepository,
  bulkUpdate,
)

export default router
