import { OauthTokenType } from './token'

export interface IOauthClient {
  _id: string
  redirectUris: string[]
  clientName : string
  clientUri: string
  logoUri?: string
  grantTypes: string[]
  responseTypes: string[]
  clientSecretExpiresAt: number
  scope: string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface OauthCodeData {
  clientId: string
  redirectUri: string
  userId: string
  codeChallenge: string
  codeChallengeMethod: string
  scope: string
  oauthTokenType: OauthTokenType
  workspaceId?: string
  projectId?: string
}

export interface OAuthAccessTokenData {
  clientId: string
  userId: string
  scope: string
  workspaceId: string
  projectId: string
}

