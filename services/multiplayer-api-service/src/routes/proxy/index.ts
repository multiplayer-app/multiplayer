import express from 'express'
import { authorize } from '@multiplayer/auth'
import request from './request'
import { ValidationMiddleware,RequestSizeLimitMiddleware, RateLimitMiddleware } from '../../middleware'
import { RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').post(
  ValidationMiddleware.ProxyValidationMiddleware.validateProxyRequest,
  authorize({
    entity: RoleProjectPermissionEntity.PROXY,
    action: RoleAccessAction.READ,
  }),
  RateLimitMiddleware,
  RequestSizeLimitMiddleware(100 * 1024),
  request,
)

export default router
