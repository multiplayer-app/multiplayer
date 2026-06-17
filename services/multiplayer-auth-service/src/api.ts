import express from 'express'
import {
  google,
  github,
  gitlab,
  local,
  logout,
  health,
  healthz,
  authType,
  userSession,
  oauthClients,
} from './routes'

const { Router } = express
const router = Router()

router.use('/health', health)
router.use('/healthz', healthz)
router.use('/github', github)
router.use('/gitlab', gitlab)
router.use('/google', google)
router.use('/local', local)
router.use('/logout', logout)
router.use('/auth-type', authType)
router.use('/user-session', userSession)
router.use('/oauth-clients', oauthClients)

export default router
