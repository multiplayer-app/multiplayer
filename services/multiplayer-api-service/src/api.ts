import express from 'express'
import {
  user,
  team,
  health,
  healthz,
  workspace,
  marketing,
  project,
  thread,
  comment,
  token,
  workspaceUser,
  googleWorkspace,
  feedback,
  ai,
  stripe,
  account,
  apiKey,
  proxy,
  assistant,
  sessionNotes,

  // git
  integration,
  repository,
  gitFile,
  gitBranch,
  gitTree,
  gitRepository,
  gitRepositoryFile,
  gitRepositoryTree,
  gitRepositoryBranch,
  gitRepositoryTag,
  gitRepositoryCommit,
  gitTag,
  gitWebhook,
  gitCommit,
  gitRepositoryWorkspace,
  integrationOauth,
  gitPublicRepository,
  gitPublicRepositoryBranch,
  gitPublicRepositoryFile,
  gitPublicRepositoryTree,
  pullRequest,

  // version
  projectBranch,
  commit,
  entity,
  entityCommit,
  projectBranchReviews,
  projectLink,
  gitRefTag,
  variableValue,
  variableSchema,
  environment,
  release,
  deployment,
  entityUpdate,
  entitySharedAdmin,
  entitySharedMe,
  sourcemaps,

  // auth
  authGithub,
  authGitlab,
  authGoogle,
  local,
  logout,
  authType,
  userSession,
  oauthClients,
} from './routes'

const { Router } = express
const router = Router()

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
router.use('/tokens', token)
router.use('/google-workspace', googleWorkspace)
router.use('/feedback', feedback)
router.use('/ai', ai)
router.use('/stripe', stripe)
router.use('/accounts', account)
router.use('/workspaces/:workspaceId/projects/:projectId/proxy', proxy)
router.use('/workspaces/:workspaceId/projects/:projectId/api-key', apiKey)
router.use('/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/assistant', assistant)
router.use('/assets/workspaces/:workspaceId/projects/:projectId/debug-sessions/:debugSessionId/notes', sessionNotes)

// git
router.use('/git/integrations', integrationOauth)
router.use('/git/workspaces/:workspaceId/integrations', integration)
router.use('/git/workspaces/:workspaceId/integrations/:integrationId/repositories', repository)
router.use('/git/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/files', gitFile)
router.use('/git/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/tree', gitTree)
router.use('/git/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/branches', gitBranch)
router.use('/git/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/branches/:branchId/commit', gitCommit)
router.use('/git/workspaces/:workspaceId/integrations/:integrationId/repositories/:repositoryId/tags', gitTag)

router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/pull-request', pullRequest)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/files', gitRepositoryFile.gitFileRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/branches/:branchId/commit', gitRepositoryCommit.gitCommitRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git/:gitId/tree', gitRepositoryTree.gitRepositoryTreeRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/git', gitRepository.gitRouter)

router.use('/git/workspaces/:workspaceId/git-repositories', gitRepositoryWorkspace)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories', gitRepository.gitRepositoryRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/tree', gitRepositoryTree.gitRepositoryTreeRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/files', gitRepositoryFile.gitRepositoryFileRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/branches', gitRepositoryBranch)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/branches/:branchId/commit', gitRepositoryCommit.gitRepositoryCommitRouter)
router.use('/git/workspaces/:workspaceId/projects/:projectId/git-repositories/:gitRepositoryId/git/tags', gitRepositoryTag)

router.use('/git/webhooks', gitWebhook)

router.use('/git/public-repositories', gitPublicRepository)
router.use('/git/public-repositories/:gitPublicRepositoryId/git/branches', gitPublicRepositoryBranch)
router.use('/git/public-repositories/:gitPublicRepositoryId/git/files', gitPublicRepositoryFile)
router.use('/git/public-repositories/:gitPublicRepositoryId/git/tree', gitPublicRepositoryTree)

// version
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches', projectBranch)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/commits', commit)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/reviews', projectBranchReviews)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities', entity)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/updates', entityUpdate)
router.use('/version/workspaces/:workspaceId/projects/:projectId/entities/shared', entitySharedAdmin)
router.use('/version/entities/shared', entitySharedMe)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/entities/:entityId/commits', entityCommit)
router.use('/version/workspaces/:workspaceId/projects/:projectId/releases', release)
router.use('/version/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/sourcemaps', sourcemaps)
router.use('/version/workspaces/:workspaceId/projects/:projectId/deployments', deployment)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/project-links', projectLink)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/git-ref-tags', gitRefTag)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/environments', environment)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/variable-values', variableValue)
router.use('/version/workspaces/:workspaceId/projects/:projectId/branches/:projectBranchId/variable-schemas', variableSchema)

// auth
router.use('/auth/github', authGithub)
router.use('/auth/gitlab', authGitlab)
router.use('/auth/google', authGoogle)
router.use('/auth/local', local)
router.use('/auth/logout', logout)
router.use('/auth/auth-type', authType)
router.use('/auth/user-session', userSession)
router.use('/auth/oauth-clients', oauthClients)

export default router
