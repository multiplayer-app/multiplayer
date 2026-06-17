import { Router } from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
  RoleType,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  WorkspaceMiddleware,
  AccountMiddleware,
  RoleMiddleware,
} from '../../middleware'
import create from './create'
import remove from './delete'
import list from './list'
import listAll from './list-all'
import get from './get'
import update from './update'
import updateIcon from './update-icon'
import addDomain from './domain-add'
import confirmDomain from './domain-confirm'
import removeDomain from './domain-remove'
import checkFeatureAccess from './check-feature-access'
import updateFeatureAccess from './update-feature-access'
import billingGetAccount from './billing-get-account'
import billingGetWorkspaceInfo from './billing-get'
import billingGetCustomerPortal from './billing-get-customer-portal'
import rolesList from './roles-list'
import accessUpdate from './access-update'
import accessPermissionsGet from './access-permissions-get'
import roleGet from './role-get'

const router = Router() as Router
const { WorkspaceValidationMiddleware } = ValidationMiddleware

router.route('/feature').patch(
  WorkspaceValidationMiddleware.validateUpdateFeatureFlag,
  authorize({ onlySuperadmin: true }),
  updateFeatureAccess,
)

router.route('/all').get(
  WorkspaceValidationMiddleware.validateListWorkspaces,
  authorize({ onlySuperadmin: true }),
  listAll,
)

router.route('/').get(
  WorkspaceValidationMiddleware.validateListWorkspaces,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
  }),
  list,
)

router.route('/').post(
  WorkspaceValidationMiddleware.validateCreateWorkspace,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
  }),
  AccountMiddleware.createAccountForUser,
  create,
)

router.route('/:workspaceId').get(
  WorkspaceValidationMiddleware.validateGetWorkspace,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/:workspaceId/feature/:flag').get(
  WorkspaceValidationMiddleware.validateCheckFeatureFlag,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.READ,
  }),
  checkFeatureAccess,
)

router.route('/:workspaceId').patch(
  WorkspaceValidationMiddleware.validateUpdateWorkspace,
  RoleMiddleware.validateRoleTypeIs({
    type: RoleType.WORKSPACE,
    propertyPath: 'settings,domainAutoJoin,workspaceRoleId',
  }),
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:workspaceId/icon').patch(
  WorkspaceValidationMiddleware.validateUpdateWorkspaceIcon,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.UPDATE,
  }),
  updateIcon,
)

router.route('/:workspaceId').delete(
  WorkspaceValidationMiddleware.validateDeleteWorkspace,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.DELETE,
  }),
  WorkspaceMiddleware.attachWorkspace,
  AccountMiddleware.attachAccountToWorkspace,
  remove,
)

router.route('/:workspaceId/domains').post(
  WorkspaceValidationMiddleware.validateAddWorkspaceDomain,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.UPDATE,
  }),
  WorkspaceMiddleware.attachWorkspace,
  addDomain,
)

router.route('/:workspaceId/domains/confirm').post(
  WorkspaceValidationMiddleware.validateConfirmWorkspaceDomain,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.UPDATE,
  }),
  confirmDomain,
)

router.route('/:workspaceId/domains/:workspaceDomainId').delete(
  WorkspaceValidationMiddleware.validateRemovemWorkspaceDomain,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.UPDATE,
  }),
  removeDomain,
)

router.route('/:workspaceId/billing/account').get(
  WorkspaceValidationMiddleware.validateGetWorkspaceBillingAccount,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.BILLING_READ,
  }),
  WorkspaceMiddleware.attachWorkspace,
  AccountMiddleware.attachAccountToWorkspace,
  billingGetAccount,
)

router.route('/:workspaceId/billing').get(
  WorkspaceValidationMiddleware.validateGetWorkspaceBillingInfo,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.BILLING_READ,
  }),
  billingGetWorkspaceInfo,
)

router.route('/:workspaceId/billing/customer-portal').get(
  WorkspaceValidationMiddleware.validateGetWorkspaceBillingInfo,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.BILLING_READ,
  }),
  WorkspaceMiddleware.attachWorkspace,
  AccountMiddleware.attachAccountToWorkspace,
  billingGetCustomerPortal,
)

router.route('/:workspaceId/roles').get(
  WorkspaceValidationMiddleware.validateListWorkspaceRoles,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.READ,
  }),
  WorkspaceMiddleware.attachWorkspace,
  rolesList,
)

router.route('/:workspaceId/role').get(
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.READ,
  }),
  WorkspaceValidationMiddleware.validateGetWorkspaceRole,
  roleGet,
)

router.route('/:workspaceId/access').patch(
  WorkspaceValidationMiddleware.validateUpdateWorkspaceAccess,
  RoleMiddleware.validateRoleTypeIs({
    type: RoleType.PROJECT,
    propertyPath: 'guest.role',
  }),
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.UPDATE_ACCESS,
  }),
  accessUpdate,
)

router.route('/:workspaceId/access/permissions').get(
  WorkspaceValidationMiddleware.validateGetWorkspaceAccessPermissions,
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE,
    action: RoleAccessAction.READ,
  }),
  accessPermissionsGet,
)


export default router
