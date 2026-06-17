import express from 'express'
import { authorize } from '@multiplayer/auth'
import generate from './generate'
import { ValidationMiddleware } from '../../middleware'
import { RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').post(
  ValidationMiddleware.ApiKeyValidationMiddleware.validateGenerateRequest,
  authorize({
    // TODO: temporary changed required permission from INTEGRATION:CREATE to PROXY:READ
    // to make it working for members.
    // Long term solution is to use endpoint for creation api-keys in git service
    entity: RoleProjectPermissionEntity.PROXY,
    action: RoleAccessAction.READ,
  }),
  generate,
)

export default router
