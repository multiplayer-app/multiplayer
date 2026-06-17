import express from 'express'
import {
  authorize,
} from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import create from './create'
import update from './update'
import remove from './remove'
import list from './list'

const { Router } = express
const router = Router({ mergeParams: true })
const { ConditonalRecordingFiltersValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS,
    action: RoleAccessAction.READ,
  }),
  ConditonalRecordingFiltersValidationMiddleware.validateListConditionalRecordingFilters,
  list,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS,
    action: RoleAccessAction.CREATE,
  }),
  ConditonalRecordingFiltersValidationMiddleware.validateCreateConditionalRecordingFilters,
  create,
)

router.route('/:conditionalRecordingFiltersId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS,
    action: RoleAccessAction.UPDATE,
  }),
  ConditonalRecordingFiltersValidationMiddleware.validateUpdateConditionalRecordingFilters,
  update,
)

router.route('/:conditionalRecordingFiltersId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.CONDITIONAL_RECORDING_FILTERS,
    action: RoleAccessAction.DELETE,
  }),
  ConditonalRecordingFiltersValidationMiddleware.validateRemoveConditionalRecordingFilters,
  remove,
)

export default router
