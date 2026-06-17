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
import remove from './delete'
import listInProject from './list-in-project'
import get from './get'

const { Router } = express
const { GitRepositoryValidationMiddleware } = ValidationMiddleware

export const gitRepositoryRouter = Router({ mergeParams: true })
gitRepositoryRouter.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryValidationMiddleware.validateListGitRepositoriesInProject,
  listInProject,
)

gitRepositoryRouter.route('/:gitRepositoryId').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryValidationMiddleware.validateGetGitRepository,
  GitRepositoryMiddleware.attachGitRepository,
  get,
)

gitRepositoryRouter.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    action: RoleAccessAction.CREATE,
  }),
  GitRepositoryValidationMiddleware.validateCreateGitRepository,
  create,
)

gitRepositoryRouter.route('/:gitRepositoryId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    action: RoleAccessAction.DELETE,
  }),
  GitRepositoryValidationMiddleware.validateDeleteGitRepository,
  remove,
)

export const gitRouter = Router({ mergeParams: true })
gitRouter.route('/:gitId').get(
  authorize({
    entity: RoleProjectPermissionEntity.GIT_REPOSITORY_INTERNAL,
    action: RoleAccessAction.READ,
  }),
  GitRepositoryValidationMiddleware.validateGetGitRepositoryByGitId,
  GitRepositoryMiddleware.attachGitRepositoryByGitId,
  get,
)
