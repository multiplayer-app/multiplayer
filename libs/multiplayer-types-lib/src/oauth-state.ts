export interface OAuthState {
  _id: string
  code_verifier?: string
  workspace?: string
  redirectUrl: string
  linkToUserId?: string
  refUser?: string
  userId?: string
  scopes?: string | string[]
  teamId?: string
  userScopes?: string | string[]
  metadata?: string
}
