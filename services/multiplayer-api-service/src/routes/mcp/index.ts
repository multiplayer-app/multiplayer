import { Request, Response, Router } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { AuthType, MultiplayerMcpServer } from '@multiplayer/mcp'
import { UnauthorizedError } from 'restify-errors'
import logger from '@multiplayer/logger'
import { McpMiddleware } from '../../middleware'

const router = Router({ mergeParams: true })


router.route('/').post(
  McpMiddleware.mcpAuthorize,
  async (req: Request, res: Response) => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError()
      }

      const server = new MultiplayerMcpServer({
        workspace: req.auth.extra?.workspace as string || '',
        project: req.auth.extra?.project as string || '',
        authKey: req.auth.token,
        authType: req.auth.extra?.tokenType as AuthType || AuthType.OAUTH_TOKEN,
      }).getServer()
      const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      })
      res.on('close', () => {
        transport.close()
        server.close()
      })
      await server.connect(transport)
      await transport.handleRequest(req as any, res, req.body)
    } catch (error) {
      logger.error({
        err: error,
        workspace: req.auth?.extra?.workspace,
        project: req.auth?.extra?.project,
      }, 'MCP request handling failed')
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        })
      }
    }
  })


const handleSessionRequest = async (req: Request, res: Response, next) => {
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed.',
    },
    id: null,
  }))
}


// Handle GET requests for server-to-client notifications via SSE
router.route('/').get(
  McpMiddleware.mcpAuthorize,
  handleSessionRequest,
)

// Handle DELETE requests for session termination
router.route('/').delete(
  McpMiddleware.mcpAuthorize,
  handleSessionRequest,
)

export default router

