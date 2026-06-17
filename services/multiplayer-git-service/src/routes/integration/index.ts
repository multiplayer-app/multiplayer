import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
  IntegrationTypeEnum,
  RoleType,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  IntegrationMiddleware,
} from '../../middleware'
import list from './list'
import remove from './delete'
import get from './get'
import update from './update'
import create from './create'
import resync from './resync'
import updateAtlassian from './update-atlassian'
import updateLinear from './update-linear'
import rotateOtelKey from './rotate-otel-key'
import getLinearStatuses from './get-linear-statuses'
import getAtlassianStatuses from './get-atlassian-statuses'
import getAtlassianOrgs from './get-atlassian-orgs'
import getOtelStatus from './get-otel-status'

const {
  IntegrationValidationMiddleware,
  RoleValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.READ,
  }),
  IntegrationValidationMiddleware.validateListIntegrationsArgs,
  list,
)

router.route('/').post(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.CREATE,
  }),
  IntegrationValidationMiddleware.validateCreateIntegrationArgs,
  RoleValidationMiddleware.validateRoleTypeIs({
    type: RoleType.WORKSPACE,
    propertyName: 'workspaceRole',
  }),
  RoleValidationMiddleware.validateRoleTypeIs({
    type: RoleType.PROJECT,
    propertyName: 'projectRole',
  }),
  create,
)

router.route('/:integrationId').delete(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.DELETE,
  }),
  IntegrationValidationMiddleware.validateDeleteIntegrationArgs,
  IntegrationMiddleware.attachIntegration,
  remove,
)

router.route('/:integrationId').patch(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.UPDATE,
  }),
  IntegrationValidationMiddleware.validateUpdateIntegrationArgs,
  RoleValidationMiddleware.validateRoleTypeIs({
    type: RoleType.WORKSPACE,
    propertyName: 'workspaceRole',
  }),
  RoleValidationMiddleware.validateRoleTypeIs({
    type: RoleType.PROJECT,
    propertyName: 'projectRole',
  }),
  IntegrationMiddleware.attachIntegration,
  update,
)

router.route('/:integrationId').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.READ,
  }),
  IntegrationValidationMiddleware.validateGetIntegrationArgs,
  get,
)

router.route('/:integrationId/linear').patch(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.UPDATE,
  }),
  IntegrationValidationMiddleware.validateUpdateLinearIntegrationArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([IntegrationTypeEnum.LINEAR]),
  updateLinear,
)

router.route('/:integrationId/linear/statuses').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.UPDATE,
  }),
  IntegrationValidationMiddleware.validateGetLinearIntegrationStatusesArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([IntegrationTypeEnum.LINEAR]),
  getLinearStatuses,
)

router.route('/:integrationId/atlassian').patch(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.UPDATE,
  }),
  IntegrationValidationMiddleware.validateUpdateAtlassianIntegrationArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([IntegrationTypeEnum.ATLASSIAN]),
  updateAtlassian,
)

router.route('/:integrationId/otel/rotate-key').patch(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.UPDATE,
  }),
  IntegrationValidationMiddleware.validateRotateRadarIntegrationKeyArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.OTEL,
  ]),
  rotateOtelKey,
)

router.route('/:integrationId/otel/status').patch(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.READ,
  }),
  IntegrationValidationMiddleware.validateGetOtelIntegrationStatusArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.OTEL,
  ]),
  getOtelStatus,
)

router.route('/:integrationId/atlassian/statuses').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.UPDATE,
  }),
  IntegrationValidationMiddleware.validateUpdateAtlassianIntegrationArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([IntegrationTypeEnum.ATLASSIAN]),
  getAtlassianStatuses,
)

router.route('/:integrationId/atlassian/orgs').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.UPDATE,
  }),
  IntegrationValidationMiddleware.validateGetAtlassianIntegrationOrgsArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([IntegrationTypeEnum.ATLASSIAN]),
  getAtlassianOrgs,
)

router.route('/:integrationId/git/resync').post(
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.READ,
  }),
  IntegrationValidationMiddleware.validateResyncIntegrationArgs,
  IntegrationMiddleware.attachIntegration,
  IntegrationValidationMiddleware.validateIntegrationType([
    IntegrationTypeEnum.GITHUB,
    IntegrationTypeEnum.GITLAB,
    IntegrationTypeEnum.BITBUCKET,
  ]),
  resync,
)

export default router
