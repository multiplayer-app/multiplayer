import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import list from './list'

const { Router } = express
const router = Router({ mergeParams: true })
const {
  AlertHistoryValidationMiddleware,
} = ValidationMiddleware

router.route('/').get(
  AlertHistoryValidationMiddleware.validateListAlertHistory,
  authorize({
    entity: RoleProjectPermissionEntity.ALERT_HISTORY,
    action: RoleAccessAction.READ,
  }),
  list,
)

export default router
