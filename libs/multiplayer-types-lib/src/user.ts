import { IWorkspaceUser } from './workspace-user'
import { UserPrimaryEmailSourceEnum } from './enums'

export interface IUser {
  _id: string

  guest?: boolean

  invite: {
    refUser?: string
    queueNumber?: number
  }
  superAdmin: boolean
  enabled: boolean
  lastLoginAt?: string | Date
  firstName?: string
  lastName?: string
  primaryEmail: string
  primaryEmailSource?: UserPrimaryEmailSourceEnum
  profiles: {
    gitlab?: {
      id?: string
      email?: string
    },
    github?: {
      id?: string
      email?: string
    },
    google?: {
      id?: string
      email?: string
    },
    local?: {
      email?: string
      passwordHash?: string
      isEmailConfirmed?: boolean
    }
  }
  workspaceUser?: IWorkspaceUser
  color?: string // todo remove after updating collaboration service
}
