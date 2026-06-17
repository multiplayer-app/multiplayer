import { AgentType } from './enums'

export interface IAgent {
  _id: string
  workspace: string
  project: string
  socketId: string
  name?: string
  type: AgentType
  maxConcurrentIssues?: number
  issuesInProgress?: number
  consecutiveTimeouts?: number
  errored?: boolean
  contextPath?: string
  noGitBranch?: boolean
  model?: string
  availableModels?: string[]
  workspaceUser: string

  settings?: {
    issueSubscription?: {
      componentName?: string[]
      environmentName?: string[]
    },
    autoResolveIssues?: boolean
    fixabilityScoreThreshold?: number
  }

  createdAt: string
  updatedAt: string
}
