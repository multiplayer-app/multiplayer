import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccountPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
} from '../../middleware'
import get from './get'
import getCustomerPortal from './get-customer-portal'
import roleGet from './role-get'

const { Router } = express
const router = Router()
const { AccountValidationMiddleware } = ValidationMiddleware

router.route('/:accountId').get(
  AccountValidationMiddleware.validateGetAccount,
  authorize({
    entity: RoleAccountPermissionEntity.ACCOUNT,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/:accountId/billing/customer-portal').get(
  AccountValidationMiddleware.validateGetAccountBillingCustomerPortal,
  authorize({
    entity: RoleAccountPermissionEntity.ACCOUNT,
    action: RoleAccessAction.READ,
  }),
  getCustomerPortal,
)

router.route('/:accountId/roles').get(
  AccountValidationMiddleware.validateGetAccountRoles,
  authorize({
    entity: RoleAccountPermissionEntity.ACCOUNT,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/:accountId/role').get(
  authorize({
    entity: RoleAccountPermissionEntity.ACCOUNT,
    action: RoleAccessAction.READ,
  }),
  AccountValidationMiddleware.validateGetAccountRole,
  roleGet,
)

export default router
