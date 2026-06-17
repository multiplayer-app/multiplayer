import { IWorkspaceUser, ProjectState, UserState } from '@multiplayer/types'

class ProjectStateController {
  private readonly states: Record<string, ProjectState>

  constructor() {
    this.states = {}
  }

  private getInitialState() {
    return {
      users: {} as Record<string, UserState>,
    } as ProjectState
  }

  getState(projectId: string) {
    if (!this.states[projectId]) {
      this.states[projectId] = this.getInitialState()
    }
    return this.states[projectId]
  }

  onUserJoinedProject(projectId: string, user: IWorkspaceUser) {
    const state = this.getState(projectId)
    if (!state.users[user._id]) {
      state.users[user._id] = { ...user }
    }

    return state
  }

  onUserLeftProject(projectId: string, userId: string) {
    const state = this.getState(projectId)
    if (!state.users[userId]) {
      return state
    }
    delete state.users[userId]
    return state
  }

  onUserJoinedBranch(projectId: string | undefined,
    user: IWorkspaceUser | undefined,
    branchId: string): ProjectState | null {
    if (!projectId || !user)
      return null

    const state = this.onUserJoinedProject(projectId, user)
    state.users[user._id].branchId = branchId
    return state
  }

  onUserLeftBranch(projectId: string | undefined,
    user: IWorkspaceUser | undefined): ProjectState | null {
    if (!projectId || !user)
      return null

    const state = this.onUserJoinedProject(projectId, user)
    state.users[user._id].branchId = undefined
    return state
  }
}

export const projectStateController = new ProjectStateController()
