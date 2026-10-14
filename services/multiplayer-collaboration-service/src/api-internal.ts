import { authorizeInternal } from '@multiplayer/auth'
import express from 'express'
import { entityState } from './routes'

const { Router } = express
const router = Router()

router.use(authorizeInternal)

router.use('/workspaces/:workspaceId/projects/:projectId/branches/:branchId/entities/:entityId/state', entityState)

export default router
