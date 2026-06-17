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
  ProjectLinkMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import removeByParams from './delete-by-params'
import list from './list'
import get from './get'
import update from './update'
import getChanges from './get-changes'
import bulkCreate from './bulk-create'

const { Router } = express
const router = Router({ mergeParams: true })
const { ProjectLinkValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    action: RoleAccessAction.READ,
  }),
  ProjectLinkValidationMiddleware.validateListProjectLinks,
  list,
)

router.route('/changes').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    action: RoleAccessAction.READ,
  }),
  ProjectLinkValidationMiddleware.validateGetChangedProjectLinks,
  getChanges,
)

router.route('/:projectLinkId').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    action: RoleAccessAction.READ,
  }),
  ProjectLinkValidationMiddleware.validateGetProjectLink,
  get,
)

router.route('/bulk').post(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    action: RoleAccessAction.CREATE,
  }),
  ProjectLinkValidationMiddleware.validateBulkCreateProjectLink,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  bulkCreate,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    action: RoleAccessAction.CREATE,
  }),
  ProjectLinkValidationMiddleware.validateCreateProjectLink,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  create,
)

router.route('/:projectLinkId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    action: RoleAccessAction.UPDATE,
  }),
  ProjectLinkValidationMiddleware.validateUpdateProjectLink,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  ProjectLinkMiddleware.attachProjectLink,
  update,
)

router.route('/:projectLinkId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_LINK,
    action: RoleAccessAction.DELETE,
  }),
  ProjectLinkValidationMiddleware.validateDeleteProjectLink,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  ProjectLinkMiddleware.attachProjectLink,
  remove,
)

router.route('/').delete(
  authorize(),
  ProjectLinkValidationMiddleware.validateDeleteProjectLinkByParams,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  removeByParams,
)

export default router
