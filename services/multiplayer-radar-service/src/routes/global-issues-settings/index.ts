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
const { GlobalIssuesSettingsValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE_SETTINGS,
    action: RoleAccessAction.READ,
  }),
  GlobalIssuesSettingsValidationMiddleware.validateGetGlobalIssuesSettings,
  get,
)

router.route('/').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE_SETTINGS,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  GlobalIssuesSettingsValidationMiddleware.validateUpdateGlobalIssuesSettings,
  update,
)

export default router
