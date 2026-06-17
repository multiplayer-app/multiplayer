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

const { GitRepositoryTreeValidationMiddleware } = ValidationMiddleware

const { Router } = express
export const gitRepositoryTreeRouter = Router({ mergeParams: true })
gitRepositoryTreeRouter.route('/:path').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryTreeValidationMiddleware.validateGetGitRepositoryTreeArgs,
  GitRepositoryMiddleware.attachGitRepository,
  list,
)

export const gitTreeRouter = Router({ mergeParams: true })
gitRepositoryTreeRouter.route('/:path').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryTreeValidationMiddleware.validateGetGitRepositoryTreeByGitIdArgs,
  GitRepositoryMiddleware.attachGitRepositoryByGitId,
  list,
)
