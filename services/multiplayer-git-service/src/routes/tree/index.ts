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

const {
  TreeValidationMiddleware,
  IntegrationValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/:path').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    action: RoleAccessAction.READ,
  }),
  TreeValidationMiddleware.validateGetRepositoryTreeArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.GITHUB,
    IntegrationTypeEnum.GITLAB,
    IntegrationTypeEnum.BITBUCKET,
  ]),
  list,
)

export default router
