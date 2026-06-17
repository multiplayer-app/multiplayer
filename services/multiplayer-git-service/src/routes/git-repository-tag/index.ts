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

const { GitRepositoryTagValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_BRANCH,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryTagValidationMiddleware.validateListGitRepositoryTagsArgs,
  GitRepositoryMiddleware.attachGitRepository,
  list,
)

export default router
