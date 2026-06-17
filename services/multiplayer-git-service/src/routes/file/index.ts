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
import get from './get'

const {
  FileValidationMiddleware,
  IntegrationValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/:path/contents').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_FILE,
    action: RoleAccessAction.READ,
  }),
  FileValidationMiddleware.validateGetFileContentsArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.GITHUB,
    IntegrationTypeEnum.GITLAB,
    IntegrationTypeEnum.BITBUCKET,
  ]),
  get,
)

export default router
