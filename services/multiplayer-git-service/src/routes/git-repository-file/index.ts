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
import get from './get'

const { GitRepositoryFileValidationMiddleware } = ValidationMiddleware

const { Router } = express

export const gitRepositoryFileRouter = Router({ mergeParams: true })
gitRepositoryFileRouter.route('/:path/contents').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryFileValidationMiddleware.validateGetGitRepositoryFileContentsArgs,
  GitRepositoryMiddleware.attachGitRepository,
  get,
)

export const gitFileRouter = Router({ mergeParams: true })
gitFileRouter.route('/:path/contents').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_FILE,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryFileValidationMiddleware.validateGetGitRepositoryFileContentsByGitIdArgs,
  GitRepositoryMiddleware.attachGitRepositoryByGitId,
  get,
)
