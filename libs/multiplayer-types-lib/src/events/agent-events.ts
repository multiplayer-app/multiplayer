import { IIssue } from '../issue'
import { IRelease } from '../release'
import {
  IAgentChat,
  IAgentChatMessage,
} from '../agent-chat'
import { IAgent } from '../agent'

export interface AgentChatNewParams {
  chatId: string
  chat: IAgentChat
}

export enum AgentEvents {
  AGENT_CONNECTED = 'AGENT_CONNECTED',
  AGENT_DISCONNECTED = 'AGENT_DISCONNECTED',

  DEBUGGING_AGENT_RESOLVE_ISSUE = 'debugging-agent:resolve-issue',
  DEBUGGING_AGENT_READY = 'debugging-agent:ready',
  DEBUGGING_AGENT_FIX_PUSHED = 'debugging-agent:fix-pushed',
  DEBUGGING_AGENT_FIX_FAILED = 'debugging-agent:fix-failed',
  DEBUGGING_AGENT_UPDATE = 'debugging-agent:update',
  DEBUGGING_AGENT_UPDATED = 'debugging-agent:updated',

  // Chat/message events (agent → radar service)
  AGENT_MESSAGE_NEW = 'message:new',
  AGENT_CHAT_NEW = 'chat:new',
  AGENT_CHAT_UPDATE = 'chat:update',
  AGENT_CHAT_DELETE = 'chat:delete',
  AGENT_CHAT_BULK_DELETE = 'chat:bulk_delete',
  AGENT_CHAT_BULK_UPDATE = 'chat:bulk_update',

  // Subscription events (viewer → radar service)
  AGENT_CHAT_SUBSCRIBE = 'chat:subscribe',
  AGENT_CHAT_UNSUBSCRIBE = 'chat:unsubscribe',
}

export interface DebuggingAgentResolveIssueRequestParams {
  issue: IIssue
  release: IRelease
  chatId: string
  sessionId: string
  agentSettings?: {
    fixabilityScoreThreshold?: number
  }
}

export interface DebuggingAgentFixPushedRequestParams {
  chatId: string
  git: {
    branchName: string
    branchUrl?: string
    repositoryUrl: string
    prUrl?: string
    prTitle?: string
    prBody?: string
    codeChanges?: {
      additions: number
      deletions: number
    }
  }
  issue: {
    componentHash: string
  }
}

export interface DebuggingAgentFixFailedRequestParams {
  chatId: string
  issue: {
    componentHash: string
  }
  error?: string
}

export interface AgentChatSubscribeRequestParams {
  chatId: string
}

export interface AgentChatUnsubscribeRequestParams {
  chatId: string
}

export type AgentEventsMap = {
  [AgentEvents.DEBUGGING_AGENT_RESOLVE_ISSUE]: {
    requestParams: void
    responseParams: DebuggingAgentResolveIssueRequestParams
  }
  [AgentEvents.DEBUGGING_AGENT_FIX_PUSHED]: {
    requestParams: DebuggingAgentFixPushedRequestParams
    responseParams: void
  }
  [AgentEvents.DEBUGGING_AGENT_FIX_FAILED]: {
    requestParams: DebuggingAgentFixFailedRequestParams
    responseParams: void
  }
  [AgentEvents.AGENT_MESSAGE_NEW]: {
    requestParams: IAgentChatMessage
    responseParams: IAgentChatMessage
  }
  [AgentEvents.AGENT_CHAT_UPDATE]: {
    requestParams: IAgentChat
    responseParams: void
  }
  [AgentEvents.AGENT_CHAT_SUBSCRIBE]: {
    requestParams: AgentChatSubscribeRequestParams
    responseParams: { messages: unknown[] }
  }
  [AgentEvents.AGENT_CHAT_UNSUBSCRIBE]: {
    requestParams: AgentChatUnsubscribeRequestParams
    responseParams: void
  }
  [AgentEvents.AGENT_CHAT_NEW]: {
    requestParams: void
    responseParams: AgentChatNewParams
  }
  [AgentEvents.DEBUGGING_AGENT_READY]: {
    requestParams: void
    responseParams: void
  }
  [AgentEvents.AGENT_CHAT_DELETE]: {
    requestParams: void
    responseParams: {
      _id: string
      workspace: string
      project: string
    }
  }
  [AgentEvents.AGENT_CHAT_BULK_DELETE]: {
    requestParams: void
    responseParams: {
      _id: string[]
      workspace: string
      project: string
    }
  }
  [AgentEvents.AGENT_CHAT_BULK_UPDATE]: {
    requestParams: void
    responseParams: {
      data: IAgentChat[]
    }
  },
  [AgentEvents.DEBUGGING_AGENT_UPDATE]: {
    requestParams: Partial<IAgent>
    responseParams: IAgent
  }
}
