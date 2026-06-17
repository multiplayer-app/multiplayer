import express from 'express'
import { authorize } from '@multiplayer/auth'
import { ValidationMiddleware } from '../../middleware'
import list from './list'
import getCurrentUser from './get-current'
import updateCurrentUser from './update-current'
import getCurrentWorkspaceUser from './get-current-workspace-user'
import updateCurrentWorkspaceUser from './update-workspace-user'
import updateCurrentWorkspaceUserIcon from './update-workspace-user-icon'

const { Router } = express
const router = Router()
const { UserValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  UserValidationMiddleware.validateListUsersArgs,
  authorize({ onlySuperadmin: true }),
  list,
)

router.route('/current').get(
  UserValidationMiddleware.validateGetCurrentUserArgs,
  authorize({ onlyEnabled: false }),
  getCurrentUser,
)

router.route('/current').patch(
  UserValidationMiddleware.validateUpdateCurrentUserArgs,
  authorize(),
  updateCurrentUser,
)

router.route('/current/workspace-settings/:workspaceId').get(
  UserValidationMiddleware.validateGetCurrentWorkspaceUserArgs,
  authorize(),
  getCurrentWorkspaceUser,
)

router.route('/current/workspace-settings/:workspaceId').patch(
  UserValidationMiddleware.validateUpdateCurrentWorkspaceUserArgs,
  authorize(),
  updateCurrentWorkspaceUser,
)

router.route('/current/workspace-settings/:workspaceId/icon').patch(
  UserValidationMiddleware.validateUpdateCurrentWorkspaceUserIconArgs,
  authorize(),
  updateCurrentWorkspaceUserIcon,
)

export default router
