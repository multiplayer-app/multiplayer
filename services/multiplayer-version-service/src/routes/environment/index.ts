import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  ProjectBranchMiddleware,
  CommitMiddleware,
  ProjectMiddleware,
  EnvironmentMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'
import update from './update'
import get from './get'
import getChanges from './get-changes'

const { Router } = express
const router = Router({ mergeParams: true })
const { EnvironmentValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    action: RoleAccessAction.READ,
  }),
  EnvironmentValidationMiddleware.validateListEnvironment,
  list,
)

router.route('/changes').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    action: RoleAccessAction.READ,
  }),
  EnvironmentValidationMiddleware.validateGetChangedEnvironment,
  getChanges,
)

router.route('/:environmentId').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    action: RoleAccessAction.READ,
  }),
  EnvironmentValidationMiddleware.validateGetEnvironment,
  get,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    action: RoleAccessAction.CREATE,
  }),
  EnvironmentValidationMiddleware.validateCreateEnvironment,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectMiddleware.attachProject,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  create,
)

router.route('/:environmentId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    action: RoleAccessAction.UPDATE,
  }),
  EnvironmentValidationMiddleware.validateUpdateEnvironment,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  EnvironmentMiddleware.attachEnvironment,
  update,
)

router.route('/:environmentId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.ENVIRONMENT,
    action: RoleAccessAction.DELETE,
  }),
  EnvironmentValidationMiddleware.validateDeleteEnvironment,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  EnvironmentMiddleware.attachEnvironment,
  remove,
)

export default router
