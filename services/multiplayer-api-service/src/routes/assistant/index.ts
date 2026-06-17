import express from 'express'
import { authorize } from '@multiplayer/auth'
import { RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'
import { RateLimitMiddleware, ValidationMiddleware } from '../../middleware'
import generateCode from './generateCode'
import chat from './chat'

const { Router } = express
const router = Router({ mergeParams: true })
const {
  AssistantThreadValidationMiddleware,
} = ValidationMiddleware

router.route('/generate').post(
  AssistantThreadValidationMiddleware.validateGenerateCode,
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.UPDATE,
  }),
  RateLimitMiddleware,
  generateCode,
)

router.route('/chat').post(
  AssistantThreadValidationMiddleware.validateChat,
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH,
    action: RoleAccessAction.UPDATE,
  }),
  chat,
)

export default router
