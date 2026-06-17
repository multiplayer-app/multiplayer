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
  VariableSchemaMiddleware,
  ProjectMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'
import update from './update'
import get from './get'
import getChanges from './get-changes'

const { Router } = express
const router = Router({ mergeParams: true })
const { VariableSchemaValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    action: RoleAccessAction.READ,
  }),
  VariableSchemaValidationMiddleware.validateListVariableSchemas,
  list,
)

router.route('/changes').get(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    action: RoleAccessAction.READ,
  }),
  VariableSchemaValidationMiddleware.validateGetChangedVariableSchemas,
  getChanges,
)

router.route('/:variableSchemaId').get(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    action: RoleAccessAction.READ,
  }),
  VariableSchemaValidationMiddleware.validateGetVariableSchema,
  get,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    action: RoleAccessAction.CREATE,
  }),
  VariableSchemaValidationMiddleware.validateCreateVariableSchema,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.attachProjectBranchTree,
  ProjectMiddleware.attachProject,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  VariableSchemaValidationMiddleware.validateCanCreateVariableSchemaForEntity,
  create,
)

router.route('/:variableSchemaId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    action: RoleAccessAction.UPDATE,
  }),
  VariableSchemaValidationMiddleware.validateUpdateVariableSchema,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.attachProjectBranchTree,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  VariableSchemaMiddleware.attachVariableSchema,
  update,
)

router.route('/:variableSchemaId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.VARIABLE_SCHEMA,
    action: RoleAccessAction.DELETE,
  }),
  VariableSchemaValidationMiddleware.validateDeleteVariableSchema,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.attachProjectBranchTree,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  VariableSchemaMiddleware.attachVariableSchema,
  remove,
)

export default router
