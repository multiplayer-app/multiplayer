import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  // GitRepositoryMiddleware,
} from '../../middleware'
import create from './create'

const { GitRepositoryPullRequestValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryPullRequestValidationMiddleware.validateCreateGitRepositoryPullRequestArgs,
  create,
)

export default router
