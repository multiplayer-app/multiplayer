import {
  GetEntityStateRequest,
  GetEntityStateResponse,
  UpdateEntityStateRequest,
} from '@multiplayer/types'
import { AbstractService } from './abstract.service'
import { INTERNAL_COLLABORATION_SERVICE_URI } from '../config'

export class InternalCollaborationService extends AbstractService {
  protected getBaseUrl(): string {
    return INTERNAL_COLLABORATION_SERVICE_URI
  }

  getEntityState(params: GetEntityStateRequest): Promise<GetEntityStateResponse> {
    return this.instance.get(
      `/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}/state`,
    )
  }

  updateEntityState(params: UpdateEntityStateRequest): Promise<void> {
    return this.instance.post(
      `/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}/state`,
      {
        state: params.state,
        workspaceUserId: params.workspaceUserId,
        entityType: params.entityType,
      },
    )
  }
}
