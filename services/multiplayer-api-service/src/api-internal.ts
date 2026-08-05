import { authorizeInternal, authorize } from '@multiplayer/auth'
import express from 'express'
import { RoleAccessAction, RoleProjectPermissionEntity } from '@multiplayer/types'
import {
  user,
  team,
  health,
  healthz,
  workspace,
  marketing,
  notifications,
  project,
  thread,
  comment,
  token,
  workspaceUser,

  // git
  gitRepositoryCommit,
  gitRepositoryTree,
  gitRepositoryFile,
  pullRequest,

  // version
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
  VersionValidationMiddleware,
  EntityCommitMiddleware,
  CommitMiddleware,
  ProjectBranchMiddleware,
  ProjectBranchStateMiddleware,
  VersionProjectMiddleware,
  EntityMiddleware,
  VersionWorkspaceUserMiddleware,
} from './middleware'
import createCommit from './routes/commit/create'
import mergeProjectBranches from './routes/project-branch/merge'
import resetEntityCommit from './routes/entity-commit/reset'
import updateEntityCommitMeta from './routes/entity-commit/update-meta'
import updateEntity from './routes/entity/update'

const {
  CommitValidationMiddleware,
  ProjectBranchValidationMiddleware,
  EntityCommitValidationMiddleware,
  EntityValidationMiddleware,
} = VersionValidationMiddleware

const { Router } = express
const router = Router()

router.use(authorizeInternal)

router.use('/users', user)
router.use('/health', health)
router.use('/healthz', healthz)
router.use('/workspaces', workspace)
router.use('/workspaces/:workspaceId/teams', team)
router.use('/workspaces/:workspaceId/projects', project)
router.use('/workspaces/:workspaceId/users', workspaceUser)
router.use('/workspaces/:workspaceId/projects/:projectId/threads', thread)
router.use('/workspaces/:workspaceId/projects/:projectId/comments', comment)
router.use('/marketing', marketing)
router.use('/notifications', notifications)
router.use('/tokens', token)

// git
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/pull-request', pullRequest)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/files', gitRepositoryFile.gitRepositoryFileRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/branches/:branchId/commit', gitRepositoryCommit.gitRepositoryCommitRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/tree', gitRepositoryTree.gitRepositoryTreeRouter)

router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/files', gitRepositoryFile.gitFileRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/branches/:branchId/commit', gitRepositoryCommit.gitCommitRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/tree', gitRepositoryTree.gitTreeRouter)

// version
// create commit is only from internal request
router.route('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/commits').post(
  authorize(),
  CommitValidationMiddleware.validateCreateCommit,
  EntityCommitMiddleware.attachEntityCommits,
  ProjectBranchStateMiddleware.attachProjectBranchState,
  EntityCommitMiddleware.validateEntityCommitsAreAttachable,
  ProjectBranchMiddleware.attachProjectBranch,
  VersionProjectMiddleware.attachProjectByProjectBranch,
  CommitMiddleware.attachLastCommit,
  createCommit,
)

// merge project branches is only from internal request
router.route('/version/workspaces/:workspaceId/projects/:projectId/branches/merge').post(
  authorize(),
  ProjectBranchValidationMiddleware.validateMergeBranches,
  ProjectBranchMiddleware.validateCanMerge,
  mergeProjectBranches,
)

router.route('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/reset').post(
  authorize(),
  EntityCommitValidationMiddleware.validateResetEntityCommit,
  EntityCommitMiddleware.attachEntityCommit,
  ProjectBranchMiddleware.attachProjectBranch,
  resetEntityCommit,
)

router.route('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits/:entityCommitId/meta').post(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY_COMMIT,
    action: RoleAccessAction.UPDATE,
  }),
  EntityCommitValidationMiddleware.validateUpdateEntityCommitMeta,
  EntityCommitMiddleware.attachEntityCommit,
  ProjectBranchMiddleware.attachProjectBranch,
  EntityMiddleware.attachEntity,
  EntityMiddleware.hasUniqueAliases,
  updateEntityCommitMeta,
)

router.route('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId').patch(
  authorize({
    entity: RoleProjectPermissionEntity.ENTITY,
    action: RoleAccessAction.UPDATE,
  }),
  EntityValidationMiddleware.validateInternalUpdateEntity,
  EntityMiddleware.hasUniqueAliases,
  ProjectBranchMiddleware.attachProjectBranch,
  EntityMiddleware.attachEntity,
  CommitMiddleware.attachLastCommit,
  VersionWorkspaceUserMiddleware.attachInternalWorkspaceUser,
  updateEntity,
)

router.use('/version/workspaces/:workspaceId/projects/:projectId/branches', projectBranch)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/commits', commit)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/reviews', projectBranchReviews)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities', entity)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits', entityCommit)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/platforms/:platformEntityId/relations', platformRelations)

router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/git-ref-tags', gitRefTag)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/project-links', projectLink)

export default router
