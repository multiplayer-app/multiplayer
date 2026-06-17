import { authorizeInternal } from '@multiplayer/auth'
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
} from './routes'

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
router.use('/tokens', token)

export default router
