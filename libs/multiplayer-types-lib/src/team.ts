import { IWorkspaceUser } from './workspace-user'

export enum TeamMemberRoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export interface ITeamMember {
  _id: string
  workspaceUser: string | IWorkspaceUser
  role: string
}

export interface ITeam {
  _id: string
  workspace: string
  projects: string[]
  archived?: boolean
  name: string
  iconUrl: string
  users: ITeamMember[]
  createdAt: string
  updatedAt: string
}
