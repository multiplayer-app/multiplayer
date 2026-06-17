import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleAccessAction,
  RoleProjectPermissionEntity,
} from '@multiplayer/types'
import { ValidationMiddleware } from '../../middleware'
import list from './list'
import get from './get'
import remove from './remove'
import update from './update'
import bulkRemove from './bulk-remove'
import bulkUpdate from './bulk-update'
import listSimilarIssues from './list-similar-issues'
import listAffectedEndUsers from './list-affected-end-users'
import listAffectedEndUsersByTitleHash from './list-affected-end-users-by-title-hash'
import listGrouped from './list-grouped'
import getByComponentHash from './get-by-component-hash'
import getByTitleHash from './get-by-title-hash'

const { Router } = express
const router = Router({ mergeParams: true })
const { IssueValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  IssueValidationMiddleware.validateListIssues,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  list,
)

router.route('/hash/component/:componentHash').get(
  IssueValidationMiddleware.validateGetIssueByComponentHash,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  getByComponentHash,
)

router.route('/hash/title/:titleHash').get(
  IssueValidationMiddleware.validateGetIssueByTitleHash,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  getByTitleHash,
)

router.route('/grouped').get(
  IssueValidationMiddleware.validateListGroupedIssues,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  listGrouped,
)

router.route('/bulk').patch(
  IssueValidationMiddleware.validateBulkUpdateIssues,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.UPDATE,
    bulk: true,
  }),
  bulkUpdate,
)

router.route('/bulk').delete(
  IssueValidationMiddleware.validateBulkRemoveIssues,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.DELETE,
    bulk: true,
  }),
  bulkRemove,
)

router.route('/:issueId').get(
  IssueValidationMiddleware.validateGetIssue,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  get,
)

router.route('/:issueId').patch(
  IssueValidationMiddleware.validateUpdateIssue,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.UPDATE,
  }),
  update,
)

router.route('/:issueId').delete(
  IssueValidationMiddleware.validateRemoveIssue,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.DELETE,
  }),
  remove,
)

router.route('/hash/title/:titleHash/end-users').get(
  IssueValidationMiddleware.validateListAffectedEndUsersByTitleHash,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  listAffectedEndUsersByTitleHash,
)

router.route('/:issueId/similar').get(
  IssueValidationMiddleware.validateListSimilarIssues,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  listSimilarIssues,
)

router.route('/:issueId/end-users').get(
  IssueValidationMiddleware.validateListAffectedEndUsers,
  authorize({
    entity: RoleProjectPermissionEntity.ISSUE,
    action: RoleAccessAction.READ,
  }),
  listAffectedEndUsers,
)

export default router
