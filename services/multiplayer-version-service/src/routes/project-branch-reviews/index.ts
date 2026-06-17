import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  RoleProjectPermissionEntity,
  RoleWorkspacePermissionEntity,
  RoleAccessAction,
} from '@multiplayer/types'
import {
  ValidationMiddleware,
  ProjectBranchMiddleware,
  WorkspaceUserMiddleware,
  WorkspaceMiddleware,
  ProjectMiddleware,
} from '../../middleware'
import reviewAdd from './review-add'
import reviewList from './review-list'
import reviewUpdate from './review-update'
import reviewerInvite from './reviewer-invite'
import reviewerRemove from './reviewer-remove'

const { Router } = express
const router = Router({ mergeParams: true })
const { ProjectBranchReviewValidationMiddleware } = ValidationMiddleware

router.route('/').get(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    action: RoleAccessAction.READ,
  }),
  ProjectBranchReviewValidationMiddleware.validateListBranchReviews,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  reviewList,
)

router.route('/').post(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    action: RoleAccessAction.CREATE,
  }),
  ProjectBranchReviewValidationMiddleware.validateAddBranchReview,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  reviewAdd,
)

router.route('/').patch(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    action: RoleAccessAction.UPDATE,
  }),
  ProjectBranchReviewValidationMiddleware.validateUpdateReview,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  reviewUpdate,
)

router.route('/reviewer').post(
  authorize({
    entity: RoleWorkspacePermissionEntity.WORKSPACE_MEMBER,
    action: RoleAccessAction.CREATE,
  }),
  ProjectBranchReviewValidationMiddleware.validateInviteBranchReviewer,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  reviewerInvite,
)

router.route('/reviewer').delete(
  authorize({
    entity: RoleProjectPermissionEntity.PROJECT_BRANCH_REVIEW,
    action: RoleAccessAction.UPDATE,
  }),
  ProjectBranchReviewValidationMiddleware.validateRemoveBranchReviewer,
  ProjectBranchMiddleware.attachProjectBranch,
  WorkspaceUserMiddleware.attachWorkspaceUser,
  reviewerRemove,
)

export default router
