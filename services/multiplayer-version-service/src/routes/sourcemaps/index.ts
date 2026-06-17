import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  ReleaseMiddleware,
} from '../../middleware'
import upload from './upload'

const { SourcemapValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.RELEASE,
    action: RoleAccessAction.CREATE,
  }),
  SourcemapValidationMiddleware.validateUploadSourcemapArgs,
  ReleaseMiddleware.attachReleaseById,
  upload,
)

export default router
