import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { DebugSessionMiddleware } from '../../middleware'
import getContent from './get-content'
import getSnapshot from './get-snapshot'

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/content').get(
  authorize({
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    action: RoleAccessAction.READ,
  }),
  DebugSessionMiddleware.attachDebugSession,
  getContent,
)

router.route('/snapshot').get(
  authorize({
    entity: RoleProjectPermissionEntity.SESSION_NOTES,
    action: RoleAccessAction.READ,
  }),
  DebugSessionMiddleware.attachDebugSession,
  getSnapshot,
)

export default router
