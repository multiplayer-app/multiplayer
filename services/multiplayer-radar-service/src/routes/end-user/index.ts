import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import list from './list'
import get from './get'
import remove from './remove'
import bulkRemove from './bulk-remove'
import listIssuesForEndUser from '../issues/list-issues-for-end-user'
import startRemoteSessionRecording from './start-remote-session-recording'
import stopRemoteSessionRecording from './stop-remote-session-recording'
import bulkStartRemoteSessionRecording from './bulk-start-remote-session-recording'
import bulkStopRemoteSessionRecording from './bulk-stop-remote-session-recording'
import updateSessionRecordingSettings from './update-session-recording-settings'
import bulkUpdateSessionRecordingSettings from './bulk-update-session-recording-settings'

const { Router } = express
const router = Router({ mergeParams: true })
const {
  EndUserValidationMiddleware,
  IssueValidationMiddleware,
} = ValidationMiddleware

router.route('/').get(
  EndUserValidationMiddleware.validateListEndUsers,
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/bulk').delete(
  EndUserValidationMiddleware.validateBulkRemoveEndUsers,
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.DELETE,
    bulk: true,
  }),
  bulkRemove,
)

router.route('/session-recording-settings/bulk').patch(
  EndUserValidationMiddleware.validateBulkUpdateEndUserSessionRecordingSettings,
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  bulkUpdateSessionRecordingSettings,
)

router.route('/:endUserId').get(
  EndUserValidationMiddleware.validateGetEndUser,
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/:endUserId/session-recording-settings').patch(
  EndUserValidationMiddleware.validateUpdateEndUserSessionRecordingSettings,
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.UPDATE,
  }),
  updateSessionRecordingSettings,
)

router.route('/:endUserId').delete(
  EndUserValidationMiddleware.validateRemoveEndUser,
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

router.route('/:endUserId/issues').get(
  IssueValidationMiddleware.validateListIssuesForEndUser,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  listIssuesForEndUser,
)

router.route('/:endUserId/remote-session-recording/start').patch(
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  EndUserValidationMiddleware.validateStartRemoteSessionRecording,
  startRemoteSessionRecording,
)

router.route('/:endUserId/remote-session-recording/stop').patch(
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  EndUserValidationMiddleware.validateStopRemoteSessionRecording,
  stopRemoteSessionRecording,
)

router.route('/remote-session-recording/start/bulk').patch(
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  EndUserValidationMiddleware.validateBulkStartRemoteSessionRecording,
  bulkStartRemoteSessionRecording,
)

router.route('/remote-session-recording/stop/bulk').patch(
  authorize({
    entity: RoleProjectPermissionEntity.END_USER,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  EndUserValidationMiddleware.validateBulkStopRemoteSessionRecording,
  bulkStopRemoteSessionRecording,
)

export default router
