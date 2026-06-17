import { SessionData, Session } from 'express-session'
import { ObjectId } from '@multiplayer/mongo'
import {
  IUser,
  IIntegrationApiKeyJwtPaylaod,
  OAuthState,
  RoleAccessAction,
  RoleWorkspacePermissionEntity,
  RoleProjectPermissionEntity,
  RoleAccountPermissionEntity,
  // IToken,
} from '@multiplayer/types'
import type {
  IUserDocument,
  IWorkspaceDocument,
  ITeamDocument,
  IProjectBranchDocument,
  ICommitDocument,
  IProjectDocument,
  IEntityCommitDocument,
  IEntityDocument,
  IWorkspaceUserDocument,
  IIntegrationDocument,
  IPopulatedEntityStateDocument,
  IGitRefTagDocument,
  IProjectLinkDocument,
  IVariableSchemaDocument,
  IVariableValueDocument,
  IEnvironmentDocument,
  IGitRepositoryDocument,
  IAccountDocument,
  IDebugSessionDocument,
  ITokenDocument,
  IReleaseDocument,
} from '@multiplayer/models'
import { Context } from './context'

declare module 'express-session' {
  export interface SessionData {
    users: string[]
    current: string
    user: IUser // TODO: delete that. Temporary hack for collaboration
  }
}

declare module 'http' {
  interface IncomingMessage {
    session: Session & {
      users: string[]
      current: string
      user: IUser // TODO: delete that. Temporary hack for collaboration
    },
    cookies: Record<string, string>
  }
}

export type MultiplayerSession = Session & Partial<SessionData>

declare global {
  namespace Express {
    interface User extends IUserDocument {
      _id: ObjectId
    }

    interface Request {
      isInternal: boolean
      session: MultiplayerSession
      context: Context

      rawApiKeyPayload: IIntegrationApiKeyJwtPaylaod
      rawToken: ITokenDocument

      account: IAccountDocument & Partial<IAccountDocument>
      workspace: IWorkspaceDocument & Partial<IWorkspaceDocument>
      team: ITeamDocument & Partial<ITeamDocument>
      projectBranch: IProjectBranchDocument & Partial<IProjectBranchDocument>
      projectBranchTree: IProjectBranchDocument[]
      projectBranchState: IPopulatedEntityStateDocument[]
      commit: ICommitDocument & Partial<ICommitDocument>
      lastCommit: ICommitDocument & Partial<ICommitDocument>
      entityCommits: Array<IEntityCommitDocument> & Array<Partial<IEntityCommitDocument>>
      entityCommit: IEntityCommitDocument
      entity: IEntityDocument & Partial<IEntityDocument>
      project: IProjectDocument
      projectBranchFrom: IProjectBranchDocument
      projectBranchTo: IProjectBranchDocument
      user?: IUserDocument
      workspaceUser?: IWorkspaceUserDocument
      integration: IIntegrationDocument
      gitRepository: IGitRepositoryDocument
      projectLink: IProjectLinkDocument
      gitRefTag: IGitRefTagDocument
      variableValue: IVariableValueDocument
      variableSchema: IVariableSchemaDocument
      environment: IEnvironmentDocument
      debugSession: IDebugSessionDocument
      release: IReleaseDocument

      oauthState: OAuthState
      oauthStateSessionPath: string

      rawBody: Buffer

      billingPlanLimitation?: {
        currentCount?: number,
        maxCount?: number,
        enabled?: boolean,
        entity: string,
      }

      bulk?: boolean
      overrideIdPath?: string
      access: {
        entity: RoleWorkspacePermissionEntity | RoleProjectPermissionEntity | RoleAccountPermissionEntity
        permissions: RoleAccessAction[]
      }


      auth?: {
        token: string,
        extra: {
          workspace: string,
          project: string,
          tokenType: string
        }
      }
    }
  }
}
