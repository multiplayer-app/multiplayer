import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  multer,
} from '../../middleware'
import importPlatform from './extract'

const { Router } = express
const router = Router({ mergeParams: true })
const {
  AiValidationMiddleware,
  WorkspaceValidationMiddleware,
} = ValidationMiddleware

router.route('/extract').post(
  multer(
    'image',
    ['image/png', 'image/jpg', 'image/jpeg'],
  ),
  AiValidationMiddleware.validateExtractPlatformArgs,
  authorize({
    entity: RoleWorkspacePermissionEntity.AI,
    action: RoleAccessAction.CREATE,
  }),
  WorkspaceValidationMiddleware.validateCanMakeAiRequest,
  importPlatform,
)

export default router
