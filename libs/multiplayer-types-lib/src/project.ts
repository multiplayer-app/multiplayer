import { IWorkspaceUser } from './workspace-user'
import { ITeam } from './team'
import { IAccess } from './access'
import {
  RoleAccessAction,
  IssueCategoryEnum,
  FeatureFlag,
  TraceLinkType,
} from './enums'

import { IRecordingOptions } from './recording-options'

// Opens a span's trace (or its logs) in the project's own tools; built by buildTraceLinkUrl in
// @multiplayer/util-shared
export interface ITraceLink {
  _id?: string
  type: TraceLinkType
  name: string
  // Environments whose spans the link is for; none means all
  environments?: string[]
  // Grafana Tempo / Loki
  url?: string
  datasourceUid?: string
  orgId?: number
  // Grafana Loki: LogQL with placeholders
  query?: string
  // Custom: URL with placeholders
  urlTemplate?: string
}

export interface IProjectSettings {
  traceLinks?: ITraceLink[]
  issue: {
    createOnlyForCategories: IssueCategoryEnum[],
  }
  agent?: {
    fixabilityScoreThreshold?: number
  }
  conditionalRecording: {
    enabled: boolean,
    samplingRate: number,
    maxRemoteSessionRecordings?: number,
    recordingOptions?: IRecordingOptions
    startConditions: {
      startOnError: boolean,
    },
    stopConditions: {
      idleTime?: number,
      maxTime?: number,
    },
  }
}

export interface IProjectMember {
  _id: string
  workspaceUser: string | IWorkspaceUser
  role: string
}

export interface IProject {
  _id: string
  // indicates that project is sample
  // and will be cloned by default to new users
  template?: boolean

  // indicates that project is cloned from sample project
  sample?: boolean
  teams: ITeam[]
  workspace: string
  name: string
  archived?: boolean
  iconUrl?: string
  coverImageUrl?: string
  version: string

  users: IProjectMember[]

  access: IAccess & { permissions?: RoleAccessAction[] }

  settings: IProjectSettings

  // feature flags from workspace.
  // used for public project
  featureFlags: Record<FeatureFlag, boolean>

  createdAt: string
  updatedAt: string
}
