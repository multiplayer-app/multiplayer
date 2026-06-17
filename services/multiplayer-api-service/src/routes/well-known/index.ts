import { MULTIPLAYER_BASE_API_URL, MULTIPLAYER_CLIENT_DOMAIN } from '../../config'
import { Router, type Request, type Response } from 'express'

const router = Router({ mergeParams: true })

export const getOauthProtectedResourceMetadata = () => {
  const baseUrl = MULTIPLAYER_BASE_API_URL

  return {
    resource: `${baseUrl}/v0/api/public/mcp`,
    authorization_servers: [baseUrl],
  }
}

export const oauthProtectedResourceHandler = (_req: Request, res: Response) => {
  res.status(200).json(getOauthProtectedResourceMetadata())
}

router.route('/oauth-authorization-server').get(
  (req, res) => {
    const baseUrl = MULTIPLAYER_BASE_API_URL

    res.status(200).json({
      issuer: baseUrl,
      authorization_endpoint: `${MULTIPLAYER_CLIENT_DOMAIN}/auth/authorize`,
      token_endpoint: `${baseUrl}/v0/auth/public/oauth-clients/token`,
      registration_endpoint: `${baseUrl}/v0/auth/public/oauth-clients`,
      registration_methods_supported: ['dynamic'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [],
      response_types_supported: ['code'],
      response_modes_supported: ['query'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      revocation_endpoint: `${baseUrl}/v0/auth/public/oauth-clients/token/revoke`,
      resource: `${baseUrl}/v0/api/public/mcp`,
      authorization_servers: [baseUrl],
    })
  })

router.route('/oauth-protected-resource').get(oauthProtectedResourceHandler)

export default router
