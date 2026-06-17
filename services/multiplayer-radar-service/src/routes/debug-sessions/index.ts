import express from 'express'
import { authorize } from '@multiplayer/auth'
import { RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'
import {
  ValidationMiddleware,
  DebugSessionMiddleware,
} from '../../middleware'
import list from './list'
import get from './get'
import update from './update'
import remove from './remove'
import starAdd from './star-add'
import starRemove from './star-remove'
import viewAdd from './view-add'
import viewUpdate from './view-update'
import viewRemove from './view-remove'
import bulkDelete from './bulk-remove'
import generate from './generate'
import sessionNotesContext from './session-notes-context'

const { Router } = express
const router = Router({ mergeParams: true })
const { DebugSessionValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  DebugSessionValidationMiddleware.validateListDebugSessions,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/bulk').delete(
  DebugSessionValidationMiddleware.validateBulkDeleteDebugSessions,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.DELETE,
    bulk: true,
  }),
  bulkDelete,
)

router.route('/:debugSessionId').get(
  DebugSessionValidationMiddleware.validateGetDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.READ,
  }),
  DebugSessionMiddleware.attachDebugSession,
  get,
)

router.route('/:debugSessionId/session-notes/context').get(
  DebugSessionValidationMiddleware.validateGetDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.READ,
  }),
  sessionNotesContext,
)

router.route('/:debugSessionId/generate').get(
  DebugSessionValidationMiddleware.validateGetDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.READ,
  }),
  DebugSessionMiddleware.attachDebugSession,
  generate,
)

router.route('/:debugSessionId').delete(
  DebugSessionValidationMiddleware.validateRemoveDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

router.route('/:debugSessionId').patch(
  DebugSessionValidationMiddleware.validateUpdateDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:debugSessionId/stars').patch(
  DebugSessionValidationMiddleware.validateAddStarToDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.UPDATE,
  }),
  starAdd,
)

router.route('/:debugSessionId/stars').delete(
  DebugSessionValidationMiddleware.validateRemoveStarFromDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.UPDATE,
  }),
  starRemove,
)

router.route('/:debugSessionId/views').patch(
  DebugSessionValidationMiddleware.validateAddViewToDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.UPDATE,
  }),
  viewAdd,
)

router.route('/:debugSessionId/views/:viewId').patch(
  DebugSessionValidationMiddleware.validateUpdateDebugSessionView,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.UPDATE,
  }),
  viewUpdate,
)

router.route('/:debugSessionId/views/:viewId').delete(
  DebugSessionValidationMiddleware.validateRemoveViewFromDebugSession,
  authorize({
    entity: RoleProjectPermissionEntity.DEBUG_SESSION,
    action: RoleAccessAction.UPDATE,
  }),
  viewRemove,
)


export default router
