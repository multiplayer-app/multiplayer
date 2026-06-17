import { WorkspaceUserStatus } from './enums'

export interface IWorkspaceUser {
  _id: string
  user: string
  workspace: string
  firstName?: string
  lastName?: string
  username: string
  color: string
  timezone: string
  iconUrl: string
  createdAt: string
  updatedAt: string

  primaryEmail?: string

  status: WorkspaceUserStatus

  googleWorkspaceIntegration: boolean
  googleWorkspaceToken: {
    refresh_token?: string | null
    expiry_date?: number | null
    access_token?: string | null
    token_type?: string | null
    id_token?: string | null;
    scope?: string
  }
}


export const WorkspaceUserStatusToNameMap = {
  [WorkspaceUserStatus.ACTIVE]: { color: 'green', label: 'Active' },
  [WorkspaceUserStatus.PENDING]: { color: 'gray', label: 'Pending' },
  [WorkspaceUserStatus.NOT_ACTIVE]: { color: 'gray', label: 'Not active' },
}
