import {
  IntegrationTypeEnum,
  IntegrationAuthTypeEnum,
  OtelAgentSelectionMode,
} from './enums'
import { ProjectBranchStatus } from './project-branch'

export interface IIntegration {
  _id: string
  workspace: string
  project?: string
  type: IntegrationTypeEnum
  name?: string
  description?: string
  authType?: IntegrationAuthTypeEnum
  workspaceUser: string
  workspaceRole?: string
  projectRole?: string

  gitlab?: {
    integrationSettingsUrl?: string
    accessToken?: string
    refreshToken?: string
  },

  github?: {
    accessToken?: string,
    installationId?: number
    integrationSettingsUrl?: string
    orgId?: string
    orgName?: string
  },

  bitbucket?: {
    integrationSettingsUrl?: string
    accessToken?: string
    refreshToken?: string
  },

  atlassian?: {
    accessToken?: string,
    refreshToken?: string,
    email?: string
    orgId?: string

    ticketStatusMapping?: {
      projectBranchStatus: ProjectBranchStatus
      ticketStatus: string
    }[]
  },

  linear?: {
    accessToken?: string

    ticketStatusMapping?: {
      projectBranchStatus: ProjectBranchStatus
      ticketStatus: string
    }[]
  }

  apiKey?: {
    apiKey: string
  },

  otel?: {
    apiKey?: string
    autoMergeEnabled?: boolean
    autoCreateRelease?: boolean
    agentSelectionMode?: OtelAgentSelectionMode

    autoResolveIssues?: boolean
    autoCreateIssues?: boolean
  },

  shareApiKey?: {
    apiKey?: string
  },

  slack?: {
    accessToken?: string,
    incomingWebhook?: string,
    integrationSettingsUrl?: string
    enterpriseId?: string,
    teamId?: string,
    configurationUrl?: string
    teamName?: string
  },
}
