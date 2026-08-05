import {
  getOauthAuthorizationServerMetadata,
  getOauthProtectedResourceMetadata,
} from '../src/routes/well-known'

describe('OAuth metadata', () => {
  it('advertises the scopes required by the MCP resource', () => {
    const authorizationServer = getOauthAuthorizationServerMetadata()
    const protectedResource = getOauthProtectedResourceMetadata()

    expect(authorizationServer.scopes_supported).toEqual([
      'debug-session:read',
      'session-notes:read',
    ])
    expect(authorizationServer.resource).toBe(protectedResource.resource)
    expect(authorizationServer.authorization_servers).toEqual(
      protectedResource.authorization_servers,
    )
  })

  it('advertises public-client PKCE registration', () => {
    const metadata = getOauthAuthorizationServerMetadata()

    expect(metadata.token_endpoint_auth_methods_supported).toEqual(['none'])
    expect(metadata.code_challenge_methods_supported).toEqual(['S256'])
    expect(metadata.registration_endpoint).toBeTruthy()
  })

  // The standalone auth service was folded into this one. The actual RFC 7591
  // registration router (`oauthPublic`, from routes/auth/oauth-clients-public) is
  // mounted via cross-domain-api.ts's `router.use('/oauth-clients', oauthPublic)`,
  // itself mounted in app.ts at `${API_PREFIX}/public` - i.e. the real path is
  // `/v0/api/public/oauth-clients`, not the old standalone service's bare
  // `/v0/auth/public/oauth-clients` (confirmed live: POST to that real path returns
  // 201; the metadata previously advertised a dead path that 404s). These endpoints
  // are discovered dynamically by clients (e.g. the CLI) via this very metadata, so a
  // mismatch here silently breaks login for anyone relying on RFC 8414 discovery
  // instead of a hardcoded URL - pin the real mount point so it can't drift again.
  it('advertises the real merged-service oauth-clients path, not the retired standalone auth service one', () => {
    const metadata = getOauthAuthorizationServerMetadata()

    expect(metadata.registration_endpoint).toMatch(/\/v0\/api\/public\/oauth-clients$/)
    expect(metadata.token_endpoint).toMatch(/\/v0\/api\/public\/oauth-clients\/token$/)
    expect(metadata.revocation_endpoint).toMatch(/\/v0\/api\/public\/oauth-clients\/token\/revoke$/)
  })
})
