import { ProjectStateTestContext } from '../project-state-test-context'
import { requestHelper } from './request.helper'
import {
  EntityCreateRequest,
  EntityCreateResponse,
  EntityUpdateRequest,
  EntityUpdateResponse,
} from '@multiplayer/types'
import { Types } from 'mongoose'

export class EntityRequest {
  private readonly cookie: string
  private context: ProjectStateTestContext

  constructor(cookie: string, context: ProjectStateTestContext) {
    this.cookie = cookie
    this.context = context
  }

  async createEntity(branchId: string | Types.ObjectId, body: EntityCreateRequest) {
    const url = `/workspaces/${this.context.workspaceId}/projects/${this.context.projectId}/branches/${branchId}/entities`
    return requestHelper.post<EntityCreateResponse>(url, body, this.cookie)
  }
  async updateEntity(branchId: string | Types.ObjectId, entityId: string | Types.ObjectId, body: EntityUpdateRequest) {
    const url = `/workspaces/${this.context.workspaceId}/projects/${this.context.projectId}/branches/${branchId}/entities/${entityId}`
    return requestHelper.patch<EntityUpdateResponse>(url, body, this.cookie)
  }
}
