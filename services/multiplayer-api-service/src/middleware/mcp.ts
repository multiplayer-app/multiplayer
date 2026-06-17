import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.d.js'
import { TokenModel } from '@multiplayer/models'
import { RandomToken } from '@multiplayer/util'
import {
  Config as AuthConfig,
} from '@multiplayer/auth'
import type { Request } from 'express'
import {
  OauthAccessTokenMeta,
  RoleAccessAction,
  RoleProjectPermissionEntity,
  TokenTypeEnum,
} from '@multiplayer/types'
import { authorize } from '@multiplayer/auth'
import { UnauthorizedError } from 'restify-errors'
import { AuthType } from '@multiplayer/mcp'
import { MULTIPLAYER_BASE_API_URL } from '../config'

const mcpRequiredScope = [
  `${RoleProjectPermissionEntity.DEBUG_SESSION}:${RoleAccessAction.READ}`,
  `${RoleProjectPermissionEntity.SESSION_NOTES}:${RoleAccessAction.READ}`,
]

const tokenMiddleware = requireBearerAuth({
  resourceMetadataUrl: `${MULTIPLAYER_BASE_API_URL}/v0/api/public/oauth-protected-resource`,
  requiredScopes: mcpRequiredScope,
  verifier: {
    verifyAccessToken: async (code: string): Promise<AuthInfo> => {
      const token = await TokenModel.findByToken(RandomToken.hashToken(code))
      if (
        !token
        || token.type !== TokenTypeEnum.OAUTH_ACCESS_TOKEN
        || !token.meta
      ) {
        return {
          scopes: mcpRequiredScope,
          expiresAt: -1,
        } as unknown as AuthInfo
      }

      const meta = token.meta as OauthAccessTokenMeta

      return {
        token: code,
        clientId: meta.clientId,
        scopes: meta.scopes,
        expiresAt: (token.expiresAt || new Date()).getTime(),
        extra: {
          workspace: meta.workspace,
          project: meta.project,
          user: token.user,
          tokenType: AuthType.OAUTH_TOKEN,
        },
      }
    },
  },
})

export const mcpAuthorize = (req, res, next) => {
  if (!req.session) req.session = {} as any // set empty session for public route

  // No API key present → OAuth bearer flow (incl. unauthenticated discovery).
  // Delegate to the MCP SDK's requireBearerAuth so it can validate the token
  // or emit the 401 + WWW-Authenticate challenge that custom connectors need.
  const apiKey = req.headers[AuthConfig.AUTH_HEADER_NAME] as string | undefined
  if (!apiKey) {
    return tokenMiddleware(req, res, next)
  }

  return authorize()(req, res, (err) => {
    try {
      if (err) return next(err) //todo prepare err for mcp
      if (req.rawApiKeyPayload) {
        if (!req.rawApiKeyPayload.workspace || !req.rawApiKeyPayload.project) {
          return next(new UnauthorizedError('Provided api key cannot be used for mcp authorization'))
        }
        const code = req.headers[AuthConfig.AUTH_HEADER_NAME] as string | undefined
        req.auth = {
          token: code,
          extra: {
            workspace: req.rawApiKeyPayload.workspace,
            project: req.rawApiKeyPayload.project,
            tokenType: AuthType.API_KEY,
          },
        }
        return next()
      }
      tokenMiddleware(req, res, next)
    } catch (err) {
      return next(err)
    }
  })
}
