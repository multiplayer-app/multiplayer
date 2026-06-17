import {
  IEntity,
  IEntityCommit,
} from '@multiplayer/types'
import { VERSION_SERVICE_URI } from '../config'
import { AbstractService } from './abstract-service'

export class VersionService extends AbstractService {
  protected getBaseUrl(): string {
    return VERSION_SERVICE_URI
  }

  createEntity(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    payload: Omit<IEntity, '_id' | 'project' | 'projectBranch' | 'entityId' | 'createdAt' | 'updatedAt' | 'createdAtCommit' | 'workspace' | 'keyAliases' | 'latestEntityCommit' | 'access'>
  }): Promise<{ entity: IEntity, entityCommit: IEntityCommit }>
  {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities`, params.payload)
  }

  deleteEntity(params: { branchId: string; entityId: string; projectId: string; workspaceId: string }): Promise<any> {
    return this.instance.delete(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}`)
  }
}
