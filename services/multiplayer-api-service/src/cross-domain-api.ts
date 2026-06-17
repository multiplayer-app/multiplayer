import express from 'express'
import { corsMiddleware, expressErrorHandlerMiddleware } from '@multiplayer/util'
import bodyParser from 'body-parser'
import { loggerExpressMiddleware } from '@multiplayer/logger'
import { mcp } from './routes'
import { oauthProtectedResourceHandler } from './routes/well-known'
const { Router } = express
const router = Router()

router.use(corsMiddleware({
  corsDomain: '*',
  allowedHeaders: ['MCP-Protocol-Version', 'Authorization'],
  exposedHeaders: ['WWW-Authenticate', 'MCP-Protocol-Version'],
}))
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(loggerExpressMiddleware())

router.get('/oauth-protected-resource', oauthProtectedResourceHandler)
router.use('/mcp', mcp)
router.use(expressErrorHandlerMiddleware)
export default router