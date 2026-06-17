import express from 'express'
import {
  gitRepositoryCommit,
  gitRepositoryTree,
  gitRepositoryFile,
  pullRequest,
} from './routes'

const { Router } = express
const router = Router()

router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/pull-request', pullRequest)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/files', gitRepositoryFile.gitRepositoryFileRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/branches/:branchId/commit', gitRepositoryCommit.gitRepositoryCommitRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/tree', gitRepositoryTree.gitRepositoryTreeRouter)

router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/files', gitRepositoryFile.gitFileRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/branches/:branchId/commit', gitRepositoryCommit.gitCommitRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/tree', gitRepositoryTree.gitTreeRouter)

export default router
