import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import list from './list'
import get from './get'
import create from './create'
import remove from './remove'
import update from './update'
import runTestAction from './run-test-action'

const { Router } = express
const router = Router({ mergeParams: true })
const {
  AlertRulesValidationMiddleware,
} = ValidationMiddleware

router.route('/').get(
  AlertRulesValidationMiddleware.validateListAlertRules,
  authorize({
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/').post(
  AlertRulesValidationMiddleware.validateCreateAlertRule,
  authorize({
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    action: RoleAccessAction.CREATE,
  }),
  create,
)

router.route('/:alertRuleId').get(
  AlertRulesValidationMiddleware.validateGetAlertRule,
  authorize({
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/:alertRuleId').patch(
  AlertRulesValidationMiddleware.validateUpdateAlertRule,
  authorize({
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:alertRuleId').delete(
  AlertRulesValidationMiddleware.validateRemoveAlertRule,
  authorize({
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

router.route('/:alertRuleId/actions/test').post(
  AlertRulesValidationMiddleware.validateRunAlertRuleActionTest,
  authorize({
    entity: RoleProjectPermissionEntity.ALERT_RULE,
    action: RoleAccessAction.UPDATE,
  }),
  authorize({
    entity: RoleWorkspacePermissionEntity.INTEGRATION,
    action: RoleAccessAction.READ,
    overrideIdPath: 'body.integration',
  }),
  runTestAction,
)

export default router
