import { IWorkspaceUser } from './workspace-user'
import { ITeam } from './team'
import { IAccess } from './access'
import {
  RoleAccessAction,
  IssueCategoryEnum,
  FeatureFlag,
} from './enums'

import { IRecordingOptions } from './recording-options'

export interface IProjectSettings {
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
