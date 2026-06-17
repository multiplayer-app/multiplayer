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
  RepositoryValidationMiddleware,
  IntegrationValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY,
    action: RoleAccessAction.READ,
  }),
  RepositoryValidationMiddleware.validateListRepositoriesArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.GITHUB,
    IntegrationTypeEnum.GITLAB,
    IntegrationTypeEnum.BITBUCKET,
  ]),
  list,
)

export default router
