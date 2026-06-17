import { IUser } from './user'

export enum TokenTypeEnum {
  RESET_PASSWORD = 'RESET_PASSWORD',
  CONFIRM_EMAIL = 'CONFIRM_EMAIL',
  VERIFY_DOMAIN = 'VERIFY_DOMAIN',
  USER_INVITE = 'USER_INVITE',
  USER_WORKSPACE_INVITATION = 'USER_WORKSPACE_INVITATION',
  OAUTH_ACCESS_TOKEN = 'OAUTH_ACCESS_TOKEN',
  OAUTH_REFRESH_TOKEN = 'OAUTH_REFRESH_TOKEN',
}

export enum OauthTokenType {
  PERSONAL = 'PERSONAL',
  PROJECT = 'PROJECT',
}

export interface OauthAccessTokenMeta {
  oauthTokenType: OauthTokenType,
  workspace?: string,
  project?: string,
  scopes: string[],
  clientId: string,
}

export interface IToken {
  _id: string
  user?: string | IUser
  token: string
  type: TokenTypeEnum
  expiresAt?: Date | string
  meta: {
    inviterWorkspaceUser?: string
    domain?: string
    workspace?: string
    workspaceUser?: string
  } & Partial<OauthAccessTokenMeta> // todo make cleaner types
}
