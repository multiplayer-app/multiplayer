import { IWorkspaceUser } from './workspace-user'

export interface IAccess {
  guest: {
    enabled: boolean,
    role?: string
  },

  users: {
    _id?: string,
    user: string
    role: string
  }[]

  workspaceUsers: {
    _id?: string,
    workspaceUser: string | IWorkspaceUser
    role: string
  }[]

  workspaces: {
    _id?: string,
    workspace: string
    role: string
  }[]

  projects: {
    _id?: string,
    project: string
    role: string
  }[]

  teams: {
    _id?: string,
    team: string
    role: string
  }[]

  publicLink?: {
    token: string,
    role: string
  }
}
