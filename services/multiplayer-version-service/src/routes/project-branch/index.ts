import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  GitRepositoryMiddleware,
  ProjectBranchMiddleware,
  ValidationMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'
import update from './update'
import get from './get'
import getDefault from './get-default'
import getState from './get-state'
import getConflicts from './get-conflicts'
import getChanges from './get-changes'
import getChangesStats from './get-changes-stats'
import updateDefaultGitBranch from './update-default-git-branch'
import commit from './commit'

const { Router } = express
const router = Router({ mergeParams: true })
const { ProjectBranchValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchValidationMiddleware.validateListBranches,
  list,
)

router.route('/default').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchValidationMiddleware.validateGetDefaultBranch,
  getDefault,
)

router.route('/conflicts').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchValidationMiddleware.validateGetBranchConflicts,
  getConflicts,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.CREATE,
  }),
  ProjectBranchValidationMiddleware.validateCreateBranch,
  create,
)

router.route('/:projectBranchId').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchValidationMiddleware.validateGetBranch,
  get,
)

router.route('/:projectBranchId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.UPDATE,
  }),
  ProjectBranchValidationMiddleware.validateUpdateBranch,
  update,
)

router.route('/:projectBranchId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.DELETE,
  }),
  ProjectBranchValidationMiddleware.validateDeleteBranch,
  remove,
)

router.route('/:projectBranchId/changes').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchValidationMiddleware.validateGetBranchChanges,
  getChanges,
)

router.route('/:projectBranchId/changes/stats').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchValidationMiddleware.validateGetBranchChangesStats,
  getChangesStats,
)

router.route('/:projectBranchId/state').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchValidationMiddleware.validateGetBranchStateArgs,
  getState,
)
router.route('/:projectBranchId/commit').post(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.UPDATE,
  }),
  ProjectBranchValidationMiddleware.validateCommitBranchArgs,
  ProjectBranchMiddleware.attachProjectBranch,
  commit,
)

router.route('/:projectBranchId/git/:gitRepositoryId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.UPDATE,
  }),
  ProjectBranchValidationMiddleware.validateUpdateDefaultGitRepositoryBranchName,
  ProjectBranchMiddleware.attachProjectBranch,
  GitRepositoryMiddleware.checkGitRepositoryAccess,
  updateDefaultGitBranch,
)


export default router
