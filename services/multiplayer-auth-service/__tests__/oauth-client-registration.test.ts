jest.mock('@multiplayer/models', () => ({
  OauthClientModel: {
    createOauthClient: jest.fn(),
  },
}), { virtual: true })

jest.mock('@multiplayer/util', () => ({
  JwtToken: {
    generateJwtToken: jest.fn(() => 'registration-token'),
  },
}), { virtual: true })

jest.mock('@multiplayer/mongo', () => ({
  ObjectId: jest.fn(() => ({ toString: () => '507f1f77bcf86cd799439011' })),
}), { virtual: true })

const { OauthClientModel } = jest.requireMock('@multiplayer/models')
// Require after virtual workspace mocks are registered.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const registerOauthClient = require('../src/routes/oauth-clients-public/register').default

describe('OAuth client registration', () => {
  it('returns a complete RFC 7591 registration response', async () => {
    const client = {
      _id: '507f1f77bcf86cd799439011',
      createdAt: new Date('2026-07-03T00:00:00.000Z'),
      clientSecretExpiresAt: 1234567890,
      redirectUris: ['http://127.0.0.1:1455/callback'],
      grantTypes: ['authorization_code', 'refresh_token'],
      responseTypes: ['code'],
      clientName: 'MCP Client',
      clientUri: 'https://example.com',
      logoUri: 'https://example.com/logo.png',
      scope: 'debug-session:read session-notes:read',
    }
    OauthClientModel.createOauthClient.mockResolvedValue(client)

    const req = {
      body: {
        redirect_uris: client.redirectUris,
        client_name: client.clientName,
        client_uri: client.clientUri,
        logo_uri: client.logoUri,
        grant_types: client.grantTypes,
        response_types: client.responseTypes,
        token_endpoint_auth_method: 'none',
        scope: client.scope,
      },
    }
    const json = jest.fn()
    const status = jest.fn(() => ({ json }))
    const next = jest.fn()

    await registerOauthClient(req as never, { status } as never, next)

    expect(next).not.toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(201)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      client_id: client._id,
      redirect_uris: client.redirectUris,
      grant_types: client.grantTypes,
      response_types: client.responseTypes,
      client_name: client.clientName,
      client_uri: client.clientUri,
      logo_uri: client.logoUri,
      token_endpoint_auth_method: 'none',
      scope: client.scope,
    }))
  })
})
