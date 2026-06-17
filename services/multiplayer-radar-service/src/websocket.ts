import redis, { type RedisClient } from '@multiplayer/redis'
import {
  expressSession,
  Config as AuthConfig,
} from '@multiplayer/auth'
import { type Server } from 'http'
import socketIo from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { corsMiddlewareOptions } from '@multiplayer/util'
import {
  API_PREFIX,
  CORS_DOMAIN,
} from './config'
import {
  AgentNamespaceHandler,
  DebugSessionNamespaceHandler,
  DebugSessionAgentNamespaceHandler,
  EndUserNamespaceHandler,
} from './ws-handlers'

let pubClient: RedisClient | undefined
let subClient: RedisClient | undefined
export let io
export let agentNamespaceHandler: AgentNamespaceHandler
export let debugSessionNamespaceHandler: DebugSessionNamespaceHandler
export let debugSessionAgentNamespaceHandler: DebugSessionAgentNamespaceHandler
export let endUserNamespaceHandler: EndUserNamespaceHandler

export const start = async (httpServer: Server) => {
  pubClient = redis.createClient()
  subClient = pubClient.duplicate()

  await pubClient.connect()
  await subClient.connect()

  io = new socketIo.Server(httpServer, {
    cors: corsMiddlewareOptions({
      corsDomain: CORS_DOMAIN,
      allowedHeaders: [
        AuthConfig.AUTH_HEADER_NAME,
        AuthConfig.CURRENT_USER_HEADER_NAME,
        AuthConfig.OAUTH_HEADER_NAME,
      ],
    }),
    path: `${API_PREFIX}/ws`,
    maxHttpBufferSize: 3e6,
  })

  io.adapter(createAdapter(
    pubClient,
    subClient,
  ))

  io.use((socket, next) => {
    expressSession()(socket.request, {} as any, next)
  })

  io.engine.use(async (req, res, next) => {
    try {
      const isHandshake = req._query.sid === undefined
      if (!isHandshake) {
        return next()
      }

      const apiKeyFromQuery = req._query?.[AuthConfig.AUTH_HEADER_NAME]

      req.apiKeyFromQuery = apiKeyFromQuery

      return next()
    } catch (err) {
      return next()
    }
  })

  agentNamespaceHandler = new AgentNamespaceHandler(io)
  debugSessionNamespaceHandler = new DebugSessionNamespaceHandler(io)
  debugSessionAgentNamespaceHandler = new DebugSessionAgentNamespaceHandler(io)
  endUserNamespaceHandler = new EndUserNamespaceHandler(io)


  agentNamespaceHandler.initialize()
  debugSessionNamespaceHandler.initialize()
  debugSessionAgentNamespaceHandler.initialize()
  endUserNamespaceHandler.initialize()
}
