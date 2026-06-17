import express from 'express'
import {
  authorize,
} from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import update from './update'
import get from './get'

const { Router } = express
const router = Router({ mergeParams: true })
const { GlobalConditonalRecordingSettingsValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.REMOTE_SESSION_RECORDING_SETTINGS,
    action: RoleAccessAction.READ,
  }),
  GlobalConditonalRecordingSettingsValidationMiddleware.validateGetGlobalConditialRecordingSettings,
  get,
)

router.route('/').patch(
  authorize({
    entity: RoleProjectPermissionEntity.REMOTE_SESSION_RECORDING_SETTINGS,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  GlobalConditonalRecordingSettingsValidationMiddleware.validateUpdateRemoteSessionRecordingSettings,
  update,
)

export default router
