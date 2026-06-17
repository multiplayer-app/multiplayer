import { IEntityCommit } from '../entity-commit'
import { ICommit } from '../commit'
import { IEntity } from '../entity'
import { IComment } from '../comment'
import { IThread } from '../thread'
import { IProjectBranch } from '../project-branch'
import {
  EntityType,
  RadarDetectionEntityType,
  ProjectLinkObjectType,
} from '../enums'
import { IRadarDetectionParam } from '../radar-detection-param'
import { IRadarDetection } from '../radar-detection'

export enum CollaborationAMQPMessageType {
  ENTITY_COMMIT_CREATED = 'ENTITY_COMMIT_CREATED',
  ENTITY_CREATE = 'ENTITY_CREATE',
  ENTITY_DELETE = 'ENTITY_DELETE',
  ENTITY_UPDATE = 'ENTITY_UPDATE',
  BRANCH_DELETE = 'BRANCH_DELETE',
  THREAD_CREATE = 'THREAD_CREATE',
  COMMENT_CREATE = 'COMMENT_CREATE',
  INTEGRATION_UPDATE = 'INTEGRATION_UPDATE',
  PROJECT_LINK_DELETE = 'PROJECT_LINK_DELETE',
  PROJECT_BRANCH_UPDATE = 'PROJECT_BRANCH_UPDATE',
}

export enum CollaborationRPCMessageType {
  GET_ENTITY_STATE = 'GET_ENTITY_STATE',
  UPDATE_ENTITY_STATE = 'UPDATE_ENTITY_STATE',
}

export interface EntityCommitMessage {
  workspaceId: string
  projectId: string
  branchId: string
  entityId: string
  isDefaultBranch: boolean
  entityCommit: Omit<IEntityCommit, 'commit'> & { commit: ICommit }
  commit: ICommit
  entity: IEntity
}

export interface ThreadCreatedMessage {
  comment: IComment
  thread: IThread
}

export interface CommentCreatedMessage {
  comment: IComment
  thread: IThread
}

export interface EntityCreatedMessage {
  entityCommit: IEntityCommit
  entity: IEntity
  isDefaultBranch: boolean
}

export interface EntityUpdatedMessage {
  entity: IEntity
  entityUpdatedAt: string | Date
  isDefaultBranch: boolean
  branchId: string
}
export interface EntityDeletedMessage {
  workspaceId: string,
  projectId: string,
  entityId: string
  branchId: string
  isDefaultBranch: boolean
  entity: IEntity
}

export interface BranchDeletedMessage {
  workspaceId: string
  projectId: string
  branchId: string
}
export interface UpdateEntityStateRequest {
  projectId: string
  branchId: string
  entityId: string
  state: number[]
  workspaceUserId: string
  workspaceId: string
  entityType: EntityType
}

export interface GetEntityStateRequest {
  projectId: string
  branchId: string
  entityId: string
  workspaceId: string
}

export interface GetEntityStateResponse {
  state: number[]
}

export interface IntegrationUpdateMessage {
  workspaceId: string
  projectId: string
  integrationId: string
}

export interface ApplyDetectionMessage {
  workspaceId: string
  projectId: string
  projectBranchId: string
  type: RadarDetectionEntityType
  platformEntityId: string
  integrationId: string
  detection: IRadarDetectionParam | IRadarDetection
}

export interface ProjectLinkDeletedMessage {
  workspaceId: string,
  projectId: string,
  branchId: string
  projectLinkId: string
  isDefaultBranch: boolean
  sourceObjectType?: ProjectLinkObjectType
  sourceObjectId?: string
  targetObjectId?: string
  targetObjectType?: ProjectLinkObjectType
  sourceEntityType?: EntityType
  targetEntityType?: EntityType
}

export interface MoveDebugSessionDataToS3Message {
  debugSessionId: string
}

export interface EntityDeletedEventMessage {
  type: CollaborationAMQPMessageType.PROJECT_BRANCH_UPDATE,
  variables: EntityDeletedMessage
}

export interface ProjectBranchUpdatedEventMessage {
  type: CollaborationAMQPMessageType.PROJECT_BRANCH_UPDATE,
  variables: {
    projectBranch: IProjectBranch,
  }
}
