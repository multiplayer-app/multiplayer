import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  EntityMiddleware,
  EntityCommitMiddleware,
  ProjectBranchMiddleware,
  ProjectMiddleware,
} from '../../middleware'
import list from './list'
import create from './create'
import update from './update'
import get from './get'
import getLastInBranch from './get-last-in-branch'
import getLatest from './get-latest'
import getContents from './get-contents'
import getContentsJson from './get-contents-json'
import copy from './copy'
import { validateEntityCommitAccess } from '../../middleware/entity-commit'

const { Router } = express
const router = Router({ mergeParams: true })
const { EntityCommitValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.READ,
  }),
  EntityCommitValidationMiddleware.validateListEntityCommits,
  list,
)

router.route('/last').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.READ,
  }),
  EntityCommitValidationMiddleware.validateGetLatestEntityCommit,
  getLastInBranch,
)

router.route('/latest').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.READ,
  }),
  EntityCommitValidationMiddleware.validateGetLatestEntityCommit,
  getLatest,
)

router.route('/:entityCommitId').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.READ,
  }),
  EntityCommitValidationMiddleware.validateGetEntityCommit,
  EntityCommitMiddleware.attachEntityCommit,
  get,
)

router.route('/:entityCommitId/contents').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.READ,
  }),
  EntityCommitValidationMiddleware.validateGetEntityCommit,
  validateEntityCommitAccess,
  getContents,
)
router.route('/:entityCommitId/contents/json').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.READ,
  }),
  EntityCommitValidationMiddleware.validateGetEntityCommit,
  validateEntityCommitAccess,
  getContentsJson,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.CREATE,
  }),
  EntityCommitValidationMiddleware.validateCreateEntityCommit,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectMiddleware.attachProjectByProjectBranch,
  EntityMiddleware.attachEntity,
  create,
)

router.route('/:entityCommitId/copy').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.CREATE,
  }),
  EntityCommitValidationMiddleware.validateCopyEntityCommit,
  EntityCommitMiddleware.attachEntityCommit,
  copy,
)

router.route('/:entityCommitId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.UPDATE,
  }),
  EntityCommitValidationMiddleware.validateUpdateEntityCommit,
  EntityCommitMiddleware.attachEntityCommit,
  EntityCommitMiddleware.validatEntityCommitFileUploaded,
  update,
)

export default router
