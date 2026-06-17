import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
} from '../../middleware'
import list from './list'
import update from './update'
import get from './get'

const { Router } = express
const router = Router({ mergeParams: true })
const { CommitValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.COMMIT,
    action: RoleAccessAction.READ,
  }),
  CommitValidationMiddleware.validateListCommits,
  list,
)

router.route('/:commitId').get(
  authorize({
    entity: RoleProjectPermissionEntity.COMMIT,
    action: RoleAccessAction.READ,
  }),
  CommitValidationMiddleware.validateGetCommit,
  get,
)

router.route('/:commitId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.COMMIT,
    action: RoleAccessAction.UPDATE,
  }),
  CommitValidationMiddleware.validateUpdateCommit,
  update,
)

export default router
