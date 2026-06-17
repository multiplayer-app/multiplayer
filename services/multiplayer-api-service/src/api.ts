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


export default router
