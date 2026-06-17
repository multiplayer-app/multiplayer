import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
  IntegrationTypeEnum,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  IntegrationMiddleware,
} from '../../middleware'
import list from './list'
import create from './create'
import get from './get'

const {
  BranchValidationMiddleware,
  IntegrationValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    action: RoleAccessAction.READ,
  }),
  BranchValidationMiddleware.validateListBranchesArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.GITHUB,
    IntegrationTypeEnum.GITLAB,
    IntegrationTypeEnum.BITBUCKET,
  ]),
  list,
)

router.route('/:branchName').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    action: RoleAccessAction.READ,
  }),
  BranchValidationMiddleware.validateGetBranchArgs,
  IntegrationMiddleware.attachIntegration,
  get,
)

router.route('/').post(
  authorize({
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_BRANCH,
    action: RoleAccessAction.CREATE,
  }),
  BranchValidationMiddleware.validateCreateBranchArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.GITHUB,
    IntegrationTypeEnum.GITLAB,
    IntegrationTypeEnum.BITBUCKET,
  ]),
  create,
)

export default router
