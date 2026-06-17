import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  GitRepositoryMiddleware,
} from '../../middleware'
import list from './list'
import create from './create'
import get from './get'

const { GitRepositoryBranchValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryBranchValidationMiddleware.validateListGitRepositoryBranchesArgs,
  GitRepositoryMiddleware.attachGitRepository,
  list,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    action: RoleAccessAction.CREATE,
  }),
  GitRepositoryBranchValidationMiddleware.validateCreateGitRepositoryBranchArgs,
  GitRepositoryMiddleware.attachGitRepository,
  create,
)

router.route('/:branchName').get(
  authorize(),
  GitRepositoryBranchValidationMiddleware.validateGetGitRepositoryBranchesArgs,
  GitRepositoryMiddleware.attachGitRepository,
  get,
)

// check if git branch exists
// if yes: check if it is not default, if yes => return error
// if no: create new branch in repo from entity.gitRef

export default router
