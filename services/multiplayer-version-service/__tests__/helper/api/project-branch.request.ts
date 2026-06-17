import { ProjectStateTestContext } from '../project-state-test-context'
import { requestHelper } from './request.helper'
import {
  ProjectBranchCreateRequest,
  ProjectBranchCreateResponse,
  ProjectBranchStateParams,
  ProjectBranchStateResponse,
} from '@multiplayer/types'
import { Types } from 'mongoose'

export class ProjectBranchRequest {
  private readonly cookie: string
  private context: ProjectStateTestContext

  constructor(cookie: string, context: ProjectStateTestContext) {
    this.cookie = cookie
    this.context = context
  }

  async createProjectBranch(body: ProjectBranchCreateRequest) {
    const url = `/workspaces/${this.context.workspaceId}/projects/${this.context.projectId}/branches`
    return requestHelper.post<ProjectBranchCreateResponse>(url, body, this.cookie)
  }

  async getProjectBranchState(branchId: string | Types.ObjectId, params: ProjectBranchStateParams = {}) {
    const url = `/workspaces/${this.context.workspaceId}/projects/${this.context.projectId}/branches/${branchId}/state`
    return requestHelper.get<ProjectBranchStateResponse>(url, params, this.cookie)
  }
}
