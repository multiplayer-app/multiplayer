import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  WorkspaceMiddleware,
  WorkspaceUserMiddleware,
  AccountMiddleware,
} from '../../middleware'
import list from './list'
import invite from './invite'
import update from './update'
import remove from './remove'
import leave from './leave'
import invitationResend from './invitation-resend'

const { Router } = express
const router = Router({ mergeParams: true })
const { WorkspaceUserValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  WorkspaceUserValidationMiddleware.validateListWorkspaceUsers,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/').post(
  WorkspaceUserValidationMiddleware.validateInviteWorkspaceUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.CREATE,
  }),
  WorkspaceMiddleware.attachWorkspace,
  WorkspaceMiddleware.attachWorkspaceUser,
  WorkspaceUserMiddleware.validateCanInviteUserWithRoleToWorkspace,
  invite,
)

router.route('/leave').delete(
  WorkspaceUserValidationMiddleware.validateLeaveWorkspace,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.READ,
  }),
  WorkspaceMiddleware.attachWorkspaceUser,
  WorkspaceMiddleware.attachWorkspace,
  WorkspaceUserMiddleware.validateCanLeaveWorkspace,
  AccountMiddleware.attachAccountToWorkspace,
  leave,
)

router.route('/:workspaceMemberId').patch(
  WorkspaceUserValidationMiddleware.validateUpdateWorkspaceUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.UPDATE,
  }),
  WorkspaceUserMiddleware.validateCanChangeUserRole,
  update,
)

router.route('/:workspaceMemberId').delete(
  WorkspaceUserValidationMiddleware.validateDeleteWorkspaceUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.DELETE,
  }),
  WorkspaceMiddleware.attachWorkspace,
  AccountMiddleware.attachAccountToWorkspace,
  WorkspaceUserMiddleware.validateCanRemoveUser,
  remove,
)

router.route('/:workspaceUserId/invitation/resend').post(
  WorkspaceUserValidationMiddleware.validateResendWorkspaceInvitation,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.UPDATE,
  }),
  WorkspaceMiddleware.attachWorkspaceUser,
  invitationResend,
)

export default router
