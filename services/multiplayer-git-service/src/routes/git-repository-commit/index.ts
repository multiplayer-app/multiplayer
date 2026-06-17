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
import create from './create'

const { GitRepositoryCommitValidationMiddleware } = ValidationMiddleware

const { Router } = express

export const gitRepositoryCommitRouter = Router({ mergeParams: true })
gitRepositoryCommitRouter.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    action: RoleAccessAction.CREATE,
  }),
  GitRepositoryCommitValidationMiddleware.validateCreateGitRepositoryCommitArgs,
  GitRepositoryMiddleware.attachGitRepository,
  create,
)

export const gitCommitRouter = Router({ mergeParams: true })
gitRepositoryCommitRouter.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL_COMMIT,
    action: RoleAccessAction.CREATE,
  }),
  GitRepositoryCommitValidationMiddleware.validateCreateGitRepositoryCommitByGitIdArgs,
  GitRepositoryMiddleware.attachGitRepositoryByGitId,
  create,
)
