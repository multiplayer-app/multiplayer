import express from 'express'
import { authorize } from '@multiplayer/auth'
import {
  projectBranch,
  commit,
  entityCommit,
  entity,
  projectLink,
  gitRefTag,
  platformRelations,
  projectBranchReviews,
} from './routes'
import {
  ValidationMiddleware,
  EntityCommitMiddleware,
  CommitMiddleware,
  ProjectBranchMiddleware,
  ProjectBranchStateMiddleware,
  ProjectMiddleware,
  EntityMiddleware,
  WorkspaceUserMiddleware,
} from './middleware'
import createCommit from './routes/commit/create'
import mergeProjectBranches from './routes/project-branch/merge'
import reset from './routes/entity-commit/reset'
import { RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'
import updateMeta from './routes/entity-commit/update-meta'
import update from './routes/entity/update'

const {
  CommitValidationMiddleware,
  ProjectBranchValidationMiddleware,
  EntityCommitValidationMiddleware,
  EntityValidationMiddleware,
} = ValidationMiddleware

const { Router } = express
const router = Router()

// create commit is only from internal request
router.route('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/commits').post(
  authorize(),
  CommitValidationMiddleware.validateCreateCommit,
  EntityCommitMiddleware.attachEntityCommits,
  ProjectBranchStateMiddleware.attachProjectBranchState,
  EntityCommitMiddleware.validateEntityCommitsAreAttachable,
  ProjectBranchMiddleware.attachProjectBranch,
  ProjectMiddleware.attachProjectByProjectBranch,
  CommitMiddleware.attachLastCommit,
  createCommit,
)

// merge project branches is only from internal request
router.route('/workspaces/:workspaceId/projects/:projectId/branches/merge').post(
  authorize(),
  ProjectBranchValidationMiddleware.validateMergeBranches,
  ProjectBranchMiddleware.validateCanMerge,
  mergeProjectBranches,
)

router.route('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/reset').post(
  authorize(),
  EntityCommitValidationMiddleware.validateResetEntityCommit,
  EntityCommitMiddleware.attachEntityCommit,
  ProjectBranchMiddleware.attachProjectBranch,
  reset,
)

router.route('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/meta').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.UPDATE,
  }),
  EntityCommitValidationMiddleware.validateUpdateEntityCommitMeta,
  EntityCommitMiddleware.attachEntityCommit,
  ProjectBranchMiddleware.attachProjectBranch,
  EntityMiddleware.attachEntity,
  EntityMiddleware.hasUniqueAliases,
  updateMeta,
)

router.route('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE,
  }),
  EntityValidationMiddleware.validateInternalUpdateEntity,
  EntityMiddleware.hasUniqueAliases,
  ProjectBranchMiddleware.attachProjectBranch,
  EntityMiddleware.attachEntity,
  CommitMiddleware.attachLastCommit,
  WorkspaceUserMiddleware.attachInternalWorkspaceUser,
  update,
)

router.use('/workspaces/:workspaceId/projects/:projectId/branches', projectBranch)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/commits', commit)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/reviews', projectBranchReviews)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities', entity)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits', entityCommit)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/platforms/:platformEntityId/relations', platformRelations)

router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/git-ref-tags', gitRefTag)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/project-links', projectLink)

export default router
