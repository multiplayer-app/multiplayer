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
  GitRefTagMiddleware,
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
const { GitRefTagValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    action: RoleAccessAction.READ,
  }),
  GitRefTagValidationMiddleware.validateListGitRefTags,
  list,
)

router.route('/changes').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    action: RoleAccessAction.READ,
  }),
  GitRefTagValidationMiddleware.validateGetChangedGitRefTags,
  getChanges,
)

router.route('/:gitRefTagId').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    action: RoleAccessAction.READ,
  }),
  GitRefTagValidationMiddleware.validateGetGitRefTag,
  get,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    action: RoleAccessAction.CREATE,
  }),
  GitRefTagValidationMiddleware.validateCreateGitRefTag,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectMiddleware.attachProjectByProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  create,
)

router.route('/:gitRefTagId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    action: RoleAccessAction.UPDATE,
  }),
  GitRefTagValidationMiddleware.validateUpdateGitRefTag,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  CommitMiddleware.attachLastCommit,
  GitRefTagMiddleware.attachGitRefTag,
  update,
)

router.route('/:gitRefTagId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REF_TAG,
    action: RoleAccessAction.DELETE,
  }),
  GitRefTagValidationMiddleware.validateDeleteGitRefTag,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectBranchMiddleware.validateCanDoChangesInBranch,
  remove,
)

export default router
