import { UserPrimaryEmailSourceEnum } from './enums'

export interface IUserSession {
  _id: string
  enabled: boolean
  firstName: string
  lastName: string
  primaryEmail: string
  primaryEmailSource: UserPrimaryEmailSourceEnum
  superAdmin: boolean
  workspaces: IUserSessionWorkspace[]
}

export interface IUserSessionWorkspace {
  _id: string
  name: string
  handle: string
  iconUrl: string
  user: {
    _id: string
    workspaceUser: string
    workspaceAdmin: boolean
    workspaceOwner: boolean
    role: string
  }
  teams: {
    _id: string
    projects: string[]
    role: string
  }[]
  projects: {
    _id: string
    name: string
    role: string
    iconUrl?: string
  }[]
}