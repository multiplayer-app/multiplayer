import express from 'express'
import {
  health,
  healthz,
} from './routes'

const { Router } = express
const router = Router()

router.use('/health', health)
router.use('/healthz', healthz)

export default router
