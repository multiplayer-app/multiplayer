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
  /**
   * Set when the agent's socket disconnects; cleared on reconnect. Agents are
   * only hard-reaped after a grace period so transient blips and service
   * deploys don't kill in-flight work.
   */
  disconnectedAt?: string | null

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
