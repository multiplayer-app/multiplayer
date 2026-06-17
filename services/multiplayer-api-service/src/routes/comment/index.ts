import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  WorkspaceMiddleware,
} from '../../middleware'
import list from './list'
import get from './get'
import create from './create'
import update from './update'
import remove from './delete'

const { Router } = express
const {
  CommentValidationMiddleware,
} = ValidationMiddleware

const router = Router({ mergeParams: true })

router.route('/').get(
  CommentValidationMiddleware.validateListComments,
  authorize({
    entity: RoleProjectPermissionEntity.COMMENT,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/:commentId').get(
  CommentValidationMiddleware.validateGetComment,
  authorize({
    entity: RoleProjectPermissionEntity.COMMENT,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/').post(
  CommentValidationMiddleware.validateCreateComment,
  authorize({
    entity: RoleProjectPermissionEntity.COMMENT,
    action: RoleAccessAction.CREATE,
  }),
  WorkspaceMiddleware.attachWorkspaceUser,
  create,
)

router.route('/:commentId').patch(
  CommentValidationMiddleware.validateUpdateComment,
  authorize({
    entity: RoleProjectPermissionEntity.COMMENT,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:commentId').delete(
  CommentValidationMiddleware.validateDeleteComment,
  authorize({
    entity: RoleProjectPermissionEntity.COMMENT,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

export default router
