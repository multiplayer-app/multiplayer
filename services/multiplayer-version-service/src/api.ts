import express from 'express'
import {
  projectBranch,
  projectBranchReviews,
  commit,
  health,
  healthz,
  entityCommit,
  entity,
  projectLink,
  gitRefTag,
  variableSchema,
  variableValue,
  environment,
  release,
  deployment,
  entityUpdate,
  entitySharedAdmin,
  entitySharedMe,
  sourcemaps,
} from './routes'

const { Router } = express
const router = Router({ mergeParams: true })

router.use('/workspaces/:workspaceId/projects/:projectId/branches', projectBranch)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/commits', commit)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/reviews', projectBranchReviews)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities', entity)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/updates', entityUpdate)
router.use('/workspaces/:workspaceId/projects/:projectId/entities/shared', entitySharedAdmin)
router.use('/entities/shared', entitySharedMe)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits', entityCommit)
router.use('/workspaces/:workspaceId/projects/:projectId/releases', release)
router.use('/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/sourcemaps', sourcemaps)
router.use('/workspaces/:workspaceId/projects/:projectId/deployments', deployment)

router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/project-links', projectLink)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/git-ref-tags', gitRefTag)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/environments', environment)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/variable-values', variableValue)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/variable-schemas', variableSchema)

router.use('/health', health)
router.use('/healthz', healthz)

export default router
