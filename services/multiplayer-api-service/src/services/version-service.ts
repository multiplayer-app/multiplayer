import { IPopulatedEntityStateDocument } from '@multiplayer/models'
import {
  DataWithCursor,
  IEntityContent,
  IEntity,
  IEntityCommit,
} from '@multiplayer/types'
import { AbstractService } from './abstract-service'
import { INTERNAL_VERSION_SERVICE_URI } from '../config'

export class MultiplayerVersionService extends AbstractService {
  protected getBaseUrl(): string {
    return INTERNAL_VERSION_SERVICE_URI
  }

  getEntityContent(params: {
    workspaceId: string,
    projectId: string,
    projectBranchId: string,
    entityId: string,
  }): Promise<IEntityContent> {
    const prefix = `/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.projectBranchId}`
    return this.instance.get(`${prefix}/entities/${params.entityId}/content`)
  }

  getProjectBranchState(params: {
    workspaceId: string,
    projectId: string,
    projectBranchId: string,
    limit?: number,
    skip?: number
    entityId?: string | string[]
  }): Promise<DataWithCursor<IPopulatedEntityStateDocument>> {
    const {
      workspaceId,
      projectId,
      projectBranchId,
      ...queryParams } = params
    const url = `/workspaces/${params.workspaceId}/projects/${params.projectId}/branches`
    return this.instance.get(`${url}/${params.projectBranchId}/state`,
      { params: queryParams },
    )
  }

  async createEntity(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    payload: Partial<IEntity & { initialState? : any }>
  }): Promise<{ entity: IEntity, entityCommit: IEntityCommit }>
  {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities`, params.payload)
  }
}

export const multiplayerInternalVersionService = new MultiplayerVersionService()
