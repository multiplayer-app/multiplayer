import express from 'express'
import {
  health,
  healthz,
  integration,
  repository,
  file,
  branch,
  tree,
  gitRepository,
  gitRepositoryFile,
  gitRepositoryTree,
  gitRepositoryBranch,
  gitRepositoryTag,
  gitRepositoryCommit,
  tag,
  webhook,
  commit,
  gitRepositoryWorkspace,
  integrationOauth,
  gitPublicRepository,
  gitPublicRepositoryBranch,
  gitPublicRepositoryFile,
  gitPublicRepositoryTree,
  test,
  pullRequest,
} from './routes'

const { Router } = express
const router = Router()

router.use('/health', health)
router.use('/healthz', healthz)
router.use('/integrations', integrationOauth)
router.use('/workspaces/:workspaceId/integrations', integration)
router.use('/workspaces/:workspaceId/integrations/:integrationId/repositories', repository)
router.use('/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/files', file)
router.use('/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/tree', tree)
router.use('/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/branches', branch)
router.use('/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/branches/:branchId/commit', commit)
router.use('/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/tags', tag)

router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/pull-request', pullRequest)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/files', gitRepositoryFile.gitFileRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/branches/:branchId/commit', gitRepositoryCommit.gitCommitRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/tree', gitRepositoryTree.gitRepositoryTreeRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/git', gitRepository.gitRouter)

router.use('/workspaces/:workspaceId/git-repositories', gitRepositoryWorkspace)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories', gitRepository.gitRepositoryRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/tree', gitRepositoryTree.gitRepositoryTreeRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/files', gitRepositoryFile.gitRepositoryFileRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/branches', gitRepositoryBranch)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/branches/:branchId/commit', gitRepositoryCommit.gitRepositoryCommitRouter)
router.use('/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/tags', gitRepositoryTag)

router.use('/webhooks', webhook)

router.use('/public-repositories', gitPublicRepository)
router.use('/public-repositories/:gitPublicRepositoryId/git/branches', gitPublicRepositoryBranch)
router.use('/public-repositories/:gitPublicRepositoryId/git/files', gitPublicRepositoryFile)
router.use('/public-repositories/:gitPublicRepositoryId/git/tree', gitPublicRepositoryTree)

router.use('/test', test)

export default router
