import express from 'express'
import { corsMiddleware } from '@multiplayer/util'
import bodyParser from 'body-parser'
import { loggerExpressMiddleware } from '@multiplayer/logger'
import { oauthPublic } from './routes'
const { Router } = express
const router = Router()

router.use(corsMiddleware({
  corsDomain: '*',
  allowedHeaders: ['MCP-Protocol-Version'],
}))
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(loggerExpressMiddleware())

router.use('/oauth-clients', oauthPublic)

export default router