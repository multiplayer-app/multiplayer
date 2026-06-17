import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  WorkspaceUserMiddleware,
} from '../../middleware'
import list from './list'
import listParams from './list-params'
import getDetectedEnvironments from './get-detected-environments'
import getDetectedComponents from './get-detected-components'
import listDependencies from './list-dependencies'
import bulkDeleteDetections from './bulk-delete'

const { Router } = express
const router = Router({ mergeParams: true })
const { RadarDetectionValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  RadarDetectionValidationMiddleware.validateListRadarDetections,
  authorize({
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/bulk').delete(
  RadarDetectionValidationMiddleware.validateBulkDeleteRadarDetectionsParams,
  authorize({
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    action: RoleAccessAction.DELETE,
    bulk: true,
  }),
  WorkspaceUserMiddleware.attachWorkspaceUser,
  bulkDeleteDetections,
)

router.route('/dependencies').get(
  RadarDetectionValidationMiddleware.validateListRadarDetectedDependencies,
  authorize({
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    action: RoleAccessAction.READ,
  }),
  listDependencies,
)

router.route('/environments').get(
  RadarDetectionValidationMiddleware.validateListRadarDetectedEnvironments,
  authorize({
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    action: RoleAccessAction.READ,
  }),
  getDetectedEnvironments,
)

router.route('/components').get(
  RadarDetectionValidationMiddleware.validateListRadarDetectedComponents,
  authorize({
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    action: RoleAccessAction.READ,
  }),
  getDetectedComponents,
)

router.route('/:endpointId/params').get(
  RadarDetectionValidationMiddleware.validateListRadarDetectionsParams,
  authorize({
    entity: RoleProjectPermissionEntity.RADAR_DETECTION,
    action: RoleAccessAction.READ,
  }),
  listParams,
)

export default router
