import {
  IEntity,
  IEntityCommit,
  ProjectLinkObjectType,
} from '@multiplayer/types'
import { VERSION_SERVICE_URI } from '../config'
import { AbstractService } from './abstract.service'

export class VersionService extends AbstractService {
  protected getBaseUrl(): string {
    return VERSION_SERVICE_URI
  }

  async createEntity(
    params: {
      workspaceId: string,
      projectId: string,
      branchId: string,
      payload: Omit<IEntity, '_id' | 'project' | 'projectBranch' | 'entityId' | 'createdAt' | 'updatedAt' | 'createdAtCommit' | 'workspace' | 'keyAliases'>
    },
  ): Promise<{
      entity: IEntity,
      entityCommit: IEntityCommit
    }> {
    return this.instance.post(
      `/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities`,
      params.payload,
    )
  }

  async deleteEntity(
    params: {
      branchId: string;
      entityId: string;
      projectId: string;
      workspaceId: string
    },
  ): Promise<any> {
    return this.instance.delete(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}`)
  }

  async createLink(payload: {
    workspaceId: string,
    projectId: string,
    projectBranchId: string,
    sourceEntityId: string,
    targetEntityId: string
  }): Promise<any> {
    return this.instance.post(`/workspaces/${payload.workspaceId}/projects/${payload.projectId}/branches/${payload.projectBranchId}/project-links`, {
      sourceObject: payload.sourceEntityId,
      sourceObjectType: ProjectLinkObjectType.Entity,
      targetObject: payload.targetEntityId,
      targetObjectType: ProjectLinkObjectType.Entity,
    })
  }

  async updateEntity(params: {
    branchId: string;
    entityId: string;
    projectId: string;
    workspaceId: string;
    payload: {
      gitRefBranch?: string;
      keyAliases?: string[]
    }

  }): Promise<any> {
    return this.instance.patch(
      `/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}`,
      params.payload,
    )
  }

  async bulkEntityDelete(params: {
    workspaceId: string;
    projectId: string;
    branchId: string;
    payload: {
      type?: string;
      entityIds?: string[]
    }
  }): Promise<any> {
    return this.instance.delete(
      `/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/bulk`,
      {
        data: params.payload,
      },
    )
  }
}
