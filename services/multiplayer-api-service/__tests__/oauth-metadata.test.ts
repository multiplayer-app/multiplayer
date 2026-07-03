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
})
