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
  VariableValueMiddleware,
  ProjectMiddleware,
  ProjectBranchStateMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'
import update from './update'
import get from './get'
import getChanges from './get-changes'

const { Router } = express
const router = Router({ mergeParams: true })
const { VariableValueValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    action: RoleAccessAction.READ,
  }),
  VariableValueValidationMiddleware.validateListVariableValues,
  list,
)

router.route('/changes').get(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    action: RoleAccessAction.READ,
  }),
  VariableValueValidationMiddleware.validateGetChangedVariableValues,
  getChanges,
)

router.route('/:variableValueId').get(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    action: RoleAccessAction.READ,
  }),
  VariableValueValidationMiddleware.validateGetVariableValue,
  get,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    action: RoleAccessAction.CREATE,
  }),
  VariableValueValidationMiddleware.validateCreateVariableValue,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectMiddleware.attachProject,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  ProjectBranchStateMiddleware.validateCanAccessEnvironment,
  CommitMiddleware.attachLastCommit,
  create,
)

router.route('/:variableValueId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    action: RoleAccessAction.UPDATE,
  }),
  VariableValueValidationMiddleware.validateUpdateVariableValue,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  VariableValueMiddleware.attachVariableValue,
  update,
)

router.route('/:variableValueId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_VALUE,
    action: RoleAccessAction.DELETE,
  }),
  VariableValueValidationMiddleware.validateDeleteVariableValue,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  VariableValueMiddleware.attachVariableValue,
  remove,
)

export default router
