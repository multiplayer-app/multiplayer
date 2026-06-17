import { RequestEntityType, IWorkspaceUser } from '@multiplayer/types'

export interface YjsSocketData {
  projectId: string
  workspaceId: string
  userId: string
  user: IWorkspaceUser
  allowEdit: boolean
}

export interface YjsEntitySocketData extends YjsSocketData {
  entityId: string
  branchId: string
  isDefaultBranch: boolean
}

export interface YjsSessionNotesSocketData extends YjsSocketData {
  sessionId: string
}


export interface YjsRequestSocketData extends YjsSocketData {
  type: RequestEntityType
  branchId: string
  isDefaultBranch: boolean
}
