import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
  RoleType,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  RoleMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'
import update from './update'
import get from './get'
import roleGet from './role-get'
import updateIcon from './update-icon'
import updateCoverImage from './update-cover-image'
import addUser from './user-add'
import listUsers from './user-list'
import updateUser from './user-update'
import removeUser from './user-remove'
import accessUpdate from './access-update'
import accessPermissionsGet from './access-permissions-get'

const { Router } = express
const router = Router({ mergeParams: true })
const { ProjectValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  ProjectValidationMiddleware.validateListProjects,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/:projectId').get(
  ProjectValidationMiddleware.validateGetProject,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/:projectId/role').get(
  ProjectValidationMiddleware.validateGetProjectAggregatedRole,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.READ,
  }),
  roleGet,
)

router.route('/').post(
  ProjectValidationMiddleware.validateCreateProject,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.CREATE,
  }),
  create,
)

router.route('/:projectId').patch(
  ProjectValidationMiddleware.validateUpdateProject,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:projectId').delete(
  ProjectValidationMiddleware.validateDeleteProject,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

router.route('/:projectId/access').patch(
  ProjectValidationMiddleware.validateUpdateProjectAccess,
  RoleMiddleware.validateRoleTypeIs({
    type: RoleType.PROJECT,
    propertyPath: 'guest.role',
  }),
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.UPDATE_ACCESS,
  }),
  accessUpdate,
)

router.route('/:projectId/access/permissions').get(
  ProjectValidationMiddleware.validateGetProjectAccessPermissions,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.READ,
  }),
  accessPermissionsGet,
)

router.route('/:projectId/icon').patch(
  ProjectValidationMiddleware.validateUpdateProjectIcon,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.UPDATE,
  }),
  updateIcon,
)

router.route('/:projectId/cover-image').patch(
  ProjectValidationMiddleware.validateUpdateProjectCoverImage,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT,
    action: RoleAccessAction.UPDATE,
  }),
  updateCoverImage,
)

router.route('/:projectId/users').post(
  ProjectValidationMiddleware.validateAddProjectUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    action: RoleAccessAction.CREATE,
  }),
  addUser,
)

router.route('/:projectId/users').get(
  ProjectValidationMiddleware.validateListProjectUsers,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    action: RoleAccessAction.READ,
  }),
  listUsers,
)

router.route('/:projectId/users/:projectUserId').patch(
  ProjectValidationMiddleware.validateUpdateProjectUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    action: RoleAccessAction.UPDATE,
  }),
  updateUser,
)

router.route('/:projectId/users/:projectUserId').delete(
  ProjectValidationMiddleware.validateDeleteProjectUser,
  authorize({
    entity: RoleWorkspacePermissionEntity.PROJECT_MEMBER,
    action: RoleAccessAction.DELETE,
  }),
  removeUser,
)

export default router
