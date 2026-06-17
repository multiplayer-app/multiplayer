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
import list from './list'
import remove from './delete'
import get from './get'
import create from './create'
import update from './update'

const { ReleaseValidationMiddleware } = ValidationMiddleware

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.RELEASE,
    action: RoleAccessAction.READ,
  }),
  ReleaseValidationMiddleware.validateListReleasesArgs,
  list,
)

router.route('/:releaseId').get(
  authorize({
    entity: RoleProjectPermissionEntity.RELEASE,
    action: RoleAccessAction.READ,
  }),
  ReleaseValidationMiddleware.validateGetReleaseArgs,
  ReleaseMiddleware.attachReleaseById,
  get,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.RELEASE,
    action: RoleAccessAction.CREATE,
  }),
  ReleaseValidationMiddleware.validateCreateReleaseArgs,
  create,
)

router.route('/:releaseId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.RELEASE,
    action: RoleAccessAction.UPDATE,
  }),
  ReleaseValidationMiddleware.validateUpdateReleaseArgs,
  update,
)

router.route('/:releaseId').delete(
  authorize({
    entity: RoleProjectPermissionEntity.RELEASE,
    action: RoleAccessAction.DELETE,
  }),
  ReleaseValidationMiddleware.validateDeleteReleaseArgs,
  remove,
)

export default router
