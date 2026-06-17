import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  ProjectBranchMiddleware,
  EntityMiddleware,
  WorkspaceUserMiddleware,
  CommitMiddleware,
  ProjectBranchStateMiddleware,
  multer,
} from '../../middleware'
import list from './list'
import get from './get'
import create from './create'
import update from './update'
import bulkCreate from './bulk-create'
import bulkUpdate from './bulk-update'
import bulkDelete from './bulk-delete'
import ai from './ai'
import remove from './delete'
import revert from './revert'
import listAliases from './list-aliases'
import merge from './merge'
import getContent from './get-content'
import commit from './commit'
import accessUpdate from './access-update'

const { Router } = express
const router = Router({ mergeParams: true })
const { EntityValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.READ,
  }),
  EntityValidationMiddleware.validateListEntities,
  list,
)

router.route('/aliases').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.READ,
  }),
  EntityValidationMiddleware.validateListAllEntityAliases,
  listAliases,
)

router.route('/merge').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.CREATE,
  }),
  EntityValidationMiddleware.validateMergeEntities,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  CommitMiddleware.attachLastCommit,
  merge,
)
router.route('/:entityId/commit').post(
  EntityValidationMiddleware.validateCommitEntity,
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE,
  }),
  ProjectBranchMiddleware.attachProjectBranch,
  commit,
)

router.route('/bulk').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.CREATE, // bulk probably should use another action, since it handles two actions
  }),
  EntityValidationMiddleware.validateBulkCreateEntities,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  CommitMiddleware.attachLastCommit,
  bulkCreate,
)

router.route('/bulk').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  EntityValidationMiddleware.validateBulkUpdateEntities,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  CommitMiddleware.attachLastCommit,
  bulkUpdate,
)

router.route('/bulk').delete(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.DELETE,
    bulk: true,
  }),
  EntityValidationMiddleware.validateBulkDeleteEntities,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  CommitMiddleware.attachLastCommit,
  ProjectBranchStateMiddleware.attachProjectBranchState,
  bulkDelete,
)

router.route('/:entityId').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.READ,
  }),
  EntityValidationMiddleware.validateGetEntity,
  get,
)
router.route('/:entityId/content').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.READ,
  }),
  EntityValidationMiddleware.validateGetEntityContent,
  getContent,
)

router.route('/:entityId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.DELETE,
  }),
  EntityValidationMiddleware.validateDeleteEntity,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  CommitMiddleware.attachLastCommit,
  EntityMiddleware.attachEntity,
  ProjectBranchStateMiddleware.attachProjectBranchState,
  remove,
)

router.route('/ai').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.CREATE,
  }),
  EntityValidationMiddleware.validateAiCreateEntity,
  EntityMiddleware.hasUniqueAliases,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  CommitMiddleware.attachLastCommit,
  ai,
)

router.route('/').post(
  multer(
    'file',
    ['application/json'],
  ),
  EntityValidationMiddleware.validateCreateEntity,
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.CREATE,
  }),
  EntityMiddleware.hasUniqueAliases,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  CommitMiddleware.attachLastCommit,
  create,
)

router.route('/:entityId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE,
  }),
  EntityValidationMiddleware.validateUpdateEntity,
  EntityMiddleware.hasUniqueAliases,
  ProjectBranchMiddleware.attachProjectBranch,
  EntityMiddleware.attachEntity,
  CommitMiddleware.attachLastCommit,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  update,
)

router.route('/:entityId/revert').delete(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE,
  }),
  EntityValidationMiddleware.validateRevertEntity,
  ProjectBranchMiddleware.attachProjectBranch,
  revert,
)

router.route('/:entityId/access').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE_ACCESS,
  }),
  EntityValidationMiddleware.validateEntityAccessUpdate,
  accessUpdate,
)


export default router
