import { AgentType, AgentChatStartReasonEnum } from './enums'
import {
  MessageRole as AgentChatMessageRole,
  AgentAttachmentType as AgentChatAttachmentType,
  AgentToolCallStatus as AgentChatToolCallStatus,
  AgentProcessStatus as AgentChatProcessStatus,
  StreamChunkType,
  ChatType as AgentChatType,
  AgentStatus as AgentChatStatus,
  AgentToolType as AgentChatToolType,
  ActivityOperationName,
} from '@multiplayer-app/ai-agent-types'
import type { ContextAttachmentMetadataV1 } from '@multiplayer-app/ai-agent-types'

export {
  AgentChatMessageRole,
  AgentChatAttachmentType,
  AgentChatToolCallStatus,
  AgentChatProcessStatus,
  StreamChunkType,
  AgentChatType,
  AgentChatStatus,
  AgentChatToolType,
  ActivityOperationName,
}

export { AgentChatStartReasonEnum }

export interface IAgentToolCall {
  _id: string
  name: string
  input: Record<string, unknown>
  status: AgentChatToolCallStatus
  output?: Record<string, unknown>
  error?: string
  requiresConfirmation?: boolean
  requiresUserAction?: boolean
  approved?: boolean
  approvalId?: string
  userResponse?: string
}

interface IAgentAttachmentBase {
  _id: string
  name: string
  url?: string
  mimeType?: string
}

export interface IAgentContextAttachment extends IAgentAttachmentBase {
  type: AgentChatAttachmentType.Context
  metadata: ContextAttachmentMetadataV1
}

export interface IAgentFileAttachment extends IAgentAttachmentBase {
  type: AgentChatAttachmentType.File
  size?: number
  metadata?: {
    uploadedAt?: string
    s3Key?: string
    s3Bucket?: string
    processingStatus?: 'pending' | 'failed' | 'processed'
    size?: number
    lastModified?: number
  }
}

export interface IAgentLinkAttachment extends IAgentAttachmentBase {
  type: AgentChatAttachmentType.Link
  metadata?: Record<string, unknown>
}

export interface IAgentArtifactAttachment extends IAgentAttachmentBase {
  type: AgentChatAttachmentType.Artifact
  metadata?: Record<string, unknown>
}

export type IAgentAttachment =
  | IAgentContextAttachment
  | IAgentFileAttachment
  | IAgentLinkAttachment
  | IAgentArtifactAttachment

export interface IAgentChatMetadata {
  issue?: {
    componentHash: string
  }
  release?: {
    _id: string
    version: string
    commitHash: string
  }
  component?: {
    entityId: string
    name: string
  }
  environment?: {
    name: string
  }
  debugSession?: {
    _id: string
  }
  attachedDebugSessions?: Array<{ _id: string }>
  [key: string]: unknown
}

export interface IAgentChat {
  _id: string
  workspace: string
  project: string
  agent: string

  title?: string
  type?: AgentChatType
  agentType?: AgentType
  agentName?: string
  status: AgentChatStatus
  contextKey?: string

  startedByWorkspaceUser?: string
  userId?: string // same as startedByWorkspaceUser

  archived?: boolean
  startReason?: AgentChatStartReasonEnum
  metadata?: IAgentChatMetadata
  model?: string
  dir?: string

  git?: {
    branchName?: string
    branchUrl?: string
    prUrl?: string
    codeChanges?: {
      additions: number
      deletions: number
    }
  }
  contextDoc?: {
    key: string
    bucket: string
    url?: string
  }
  createdAt: string
  updatedAt: string
}

export interface IAgentChatMessage {
  _id: string
  workspace: string
  project: string

  chat: string

  workspaceUser?: string

  role: AgentChatMessageRole
  content?: string

  reasoning?: string
  toolCalls?: IAgentToolCall[]
  attachments?: IAgentAttachment[]
  annotations?: Record<string, unknown>
  tokens?: number
  activity?: string
  agentName?: string

  createdAt: string
  updatedAt: string
}
