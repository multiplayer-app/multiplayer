import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
} from '../../middleware'
import upload from './upload'
import download from './download'

const { Router } = express
const router = Router({ mergeParams: true })
const { EntityUpdateValidationMiddleware } = ValidationMiddleware

router.route('/:entityUpdateId/download').get(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.READ,
  }),
  EntityUpdateValidationMiddleware.downloadEntityUpdate,
  download,
)

router.route('/:entityUpdateId/upload').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE,
  }),
  EntityUpdateValidationMiddleware.uploadEntityUpdate,
  upload,
)
export default router
