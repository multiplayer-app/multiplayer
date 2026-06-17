import express from 'express'
import { health, healthz, sessionNotes } from './routes'

const router = express.Router()

router.use('/health', health)
router.use('/healthz', healthz)
router.use('/workspaces/:workspaceId/projects/:projectId/debug-sessions/:debugSessionId/notes', sessionNotes)

export default router
