import { IWorkspaceUser } from './workspace-user'

export type UserState = IWorkspaceUser & {
  branchId?: string;
}

export interface ProjectState {
  users: Record<string, UserState>
}
