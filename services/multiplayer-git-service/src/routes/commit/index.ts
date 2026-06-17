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
import create from './create'

const {
  CommitValidationMiddleware,
  IntegrationValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').post(
  authorize({
    entity: RoleWorkspacePermissionEntity.GIT_REPOSITORY_COMMIT,
    action: RoleAccessAction.CREATE,
  }),
  CommitValidationMiddleware.validateCreateCommitArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.GITHUB,
    IntegrationTypeEnum.GITLAB,
    IntegrationTypeEnum.BITBUCKET,
  ]),
  create,
)

export default router
