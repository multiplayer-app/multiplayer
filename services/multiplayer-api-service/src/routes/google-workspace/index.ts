import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  OAuthStateMiddleware,
} from '../../middleware'
import auth from './auth'
import {
  callback,
  customRedirect,
  errorHandler,
} from './callback'
import listUsers from './users-list'

const { Router } = express
const router = Router({ mergeParams: true })
const { GoogleWorkspaceValidationMiddleware } = ValidationMiddleware

router.route('/auth').get(
  GoogleWorkspaceValidationMiddleware.validateAuthGoogleWorkspace,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.CREATE,
  }),
  auth,
)

router.route('/callback').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.CREATE,
  }),
  OAuthStateMiddleware.attachOAuthState,
  callback,
  customRedirect,
  errorHandler,
)

router.route('/users').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.CREATE,
  }),
  listUsers,
)

export default router
