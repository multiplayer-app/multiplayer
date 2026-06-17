import { IWorkspaceUser } from '@multiplayer/types'

export interface ProjectSocketData {
  projectId: string
  workspaceId: string
  defaultBranchId: string
  user?: IWorkspaceUser
  userId?: string
  allowEdit: boolean
}
