import express from 'express'
import { authorize } from '@multiplayer/auth'
import logoutCurrent from './logout-current'

const { Router } = express
const router = Router()

router.route('/').post(
  authorize({ onlyEnabled: false }),
  logoutCurrent,
)

export default router
