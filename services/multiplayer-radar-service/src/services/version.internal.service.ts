import {
  CommitType,
  DataWithCursor,
  EntityCommitMeta,
  EntityCommitMetaUpdatePayload,
  EntityCommitStatus,
  EntityCommitStorageType,
  EntityCommitChangeType,
  ICommit,
  IEntity,
  IEntityCommit,
  IPopulatedEntityState,
  EntityType,
  IProjectBranchChanges,
  ProjectLinkObjectType,
  IProjectBranch,
  IProjectLink,
} from '@multiplayer/types'
import { AbstractService } from './abstract.service'
import {
  INTERNAL_VERSION_SERVICE_URI,
} from '../config'

type GetConflictsResponse = {
  entity: IEntity
  entityCommitFrom: IEntityCommit
  entityCommitTo: IEntityCommit
  baseEntityCommit: IEntityCommit
}[]

export class InternalVersionService extends AbstractService {
  protected getBaseUrl(): string {
    return INTERNAL_VERSION_SERVICE_URI
  }

  async createCommit(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    payload: {
      message: string,
      label?: string,
      type: CommitType,
      entityCommits: string[],
      workspaceUsers: string[],
    }
  }): Promise<ICommit> {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/commits`, params.payload)
  }

  async createEntityCommit(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    entityId: string,
    payload: { changeType: EntityCommitChangeType, storageType?: EntityCommitStorageType, meta?: EntityCommitMeta }
  }): Promise<IEntityCommit> {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}/commits`, {
      ...params.payload,
    })
  }

  async updateEntityCommit(params: {
    branchId: string,
    entityId: string,
    entityCommitId: string,
    status?: EntityCommitStatus
    workspaceId: string,
    projectId: string
  }): Promise<IEntityCommit> {
    return this.instance.patch(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}/commits/${params.entityCommitId}`, {
      status: params.status,
    })
  }

  async updateEntityCommitMeta(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    entityId: string,
    entityCommitId: string,
    metaPayload?: EntityCommitMetaUpdatePayload
  }): Promise<IEntityCommit> {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}/commits/${params.entityCommitId}/meta`, {
      ...params.metaPayload,
    })
  }

  async getEntityState(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    entityId: string | string[]
  }): Promise<DataWithCursor<IPopulatedEntityState>> {
    return this.instance.get(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/state`, {
      params: { entityId: params.entityId },
    })
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

  async getChangesInBranch(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    filter: {
      changeType?: EntityCommitChangeType,
      entityType?: EntityType,
      after?: string | Date
    }
  }): Promise<DataWithCursor<IProjectBranchChanges>> {
    return this.instance.get(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/changes`, {
      params: {
        ...params.filter,
      },
    })
  }

  async getConflicts(params: {
    workspaceId: string,
    projectId: string,
    projectBranchFrom: string,
    projectBranchTo: string
  }): Promise<GetConflictsResponse> {
    return this.instance.get(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/conflicts`, {
      params: {
        projectBranchFrom: params.projectBranchFrom,
        projectBranchTo: params.projectBranchTo,
      },
    })
  }

  async merge(params: {
    workspaceId: string,
    projectId: string,
    payload: {
      projectBranchFrom: string,
      projectBranchTo: string,
      workspaceUsers: string[],
      entityCommits?: string[],
      excludedEntities?: string[]
    }
  }): Promise<any> {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/merge`, params.payload)
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

  async deleteLink(params: {
    branchId: string
    sourceEntityId: string
    targetEntityId: string
    workspaceId: string
    projectId: string
  }): Promise<any> {
    const {
      workspaceId,
      projectId,
      branchId,
    } = params
    return this.instance.delete(`/workspaces/${workspaceId}/projects/${projectId}/branches/${branchId}/project-links`, {
      params: {
        sourceObject: params.sourceEntityId,
        targetObject: params.targetEntityId,
      },
    })
  }

  async listLinks(params: {
    branchId: string
    sourceEntityId: string
    targetEntityId: string
    workspaceId: string
    projectId: string
  }): Promise<DataWithCursor<IProjectLink>> {
    const {
      workspaceId,
      projectId,
      branchId,
    } = params

    return this.instance.get(`/workspaces/${workspaceId}/projects/${projectId}/branches/${branchId}/project-links`, {
      params: {
        sourceObject: params.sourceEntityId,
        targetObject: params.targetEntityId,
      },
    })
  }

  async createEdge(platformEntityId: string, projectBranchId: string, payload: {
    workspace: string;
    project: string;
    sourceEntity: string;
    targetEntity: string
  }): Promise<any> {
    return this.instance.post(`/workspaces/${payload.workspace}/projects/${payload.project}/branches/${projectBranchId}/platforms/${platformEntityId}/relations`,
      {
        sourceEntity: payload.sourceEntity,
        targetEntity: payload.targetEntity,
      },
    )
  }

  async deleteEdges(params: {
    workspaceId: string;
    projectId: string;
    platformEntityId: string,
    projectBranchId: string,
    filter: {
      sourceEntity?: string,
      targetEntity?: string,
    }
  }): Promise<any> {
    const {
      workspaceId,
      projectId,
      platformEntityId,
      projectBranchId,
    } = params
    return this.instance.delete(`/workspaces/${workspaceId}/projects/${projectId}/branches/${projectBranchId}/platforms/${platformEntityId}/relations`, {
      params: params.filter,
    })
  }

  async updateProjectBranchGitBranch(params: {
    branchId: string;
    gitRepositoryId: string;
    gitRefBranch: string;
    projectId: string;
    workspaceId: string
  }): Promise<any> {
    return this.instance.patch(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/git/${params.gitRepositoryId}`, {
      branchName: params.gitRefBranch,
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

  public getProjectBranch(params: {
    workspaceId: string,
    projectId: string,
    branchId: string
  }): Promise<IProjectBranch> {
    return this.instance.get(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}`)
  }

  async resetEntityCommit(params: {
    entityCommitId: string;
    entityId: string;
    projectBranchId: string;
    projectId: string;
    workspaceId: string
  }): Promise<IEntityCommit> {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.projectBranchId}/entities/${params.entityId}/commits/${params.entityCommitId}/reset`)
  }

  async copyEntity(params: {
    entityCommitId: string;
    entityId: string;
    projectBranchId: string;
    projectId: string;
    workspaceId: string;
    entityName?: string;
  }): Promise<{ entityCommit: IEntityCommit, entity: IEntity }> {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.projectBranchId}/entities/${params.entityId}/commits/${params.entityCommitId}/copy`,
      { entityName: params.entityName })
  }
}
