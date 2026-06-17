import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'
import update from './update'
import get from './get'
import updateIcon from './update-icon'
import listUsers from './user-list'
import updateUser from './user-update'
import deleteUser from './user-remove'
import listProjects from './project-list'
import addProject from './project-add'
import removeProject from './project-remove'

const { Router } = express
const router = Router({ mergeParams: true })
const { TeamValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  TeamValidationMiddleware.validateListTeams,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/:teamId').get(
  TeamValidationMiddleware.validateGetTeam,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/').post(
  TeamValidationMiddleware.validateCreateTeam,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.CREATE,
  }),
  create,
)

router.route('/:teamId').patch(
  TeamValidationMiddleware.validateUpdateTeam,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:teamId/icon').patch(
  TeamValidationMiddleware.validateUpdateTeamIcon,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.UPDATE,
  }),
  updateIcon,
)

router.route('/:teamId').delete(
  TeamValidationMiddleware.validateDeleteTeam,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

router.route('/:teamId/users').get(
  TeamValidationMiddleware.validateListTeamUsers,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    action: RoleAccessAction.READ,
  }),
  listUsers,
)

router.route('/:teamId/users/:teamUserId').patch(
  TeamValidationMiddleware.validateUpdateTeamUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    action: RoleAccessAction.UPDATE,
  }),
  updateUser,
)

router.route('/:teamId/users/:teamUserId').delete(
  TeamValidationMiddleware.validateDeleteTeamUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM_MEMBER,
    action: RoleAccessAction.DELETE,
  }),
  deleteUser,
)

router.route('/:teamId/projects').get(
  TeamValidationMiddleware.validateListTeamProjects,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.READ,
  }),
  listProjects,
)

router.route('/:teamId/projects').post(
  TeamValidationMiddleware.validateAddProjectToTeam,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.UPDATE,
  }),
  addProject,
)

router.route('/:teamId/projects').delete(
  TeamValidationMiddleware.validateRemoveProjectFromTeam,
  authorize({
    entity: RoleWorkspacePermissionEntity.TEAM,
    action: RoleAccessAction.UPDATE,
  }),
  removeProject,
)

export default router
