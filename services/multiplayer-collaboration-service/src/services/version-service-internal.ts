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
  IProjectBranch, GetConflictsResponse,
} from '@multiplayer/types'
import { INTERNAL_VERSION_SERVICE_URI } from '../config'
import { AbstractService } from './abstract-service'

export class InternalVersionService extends AbstractService {
  protected getBaseUrl(): string {
    return INTERNAL_VERSION_SERVICE_URI
  }

  createCommit(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    payload: {
      message: string,
      label?: string,
      type: CommitType,
      entityCommits: string[],
      workspaceUsers: string[],
    } }): Promise<ICommit> {
    return this.instance.post(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/commits`, params.payload)
  }

  createEntityCommit(params: {
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

  updateEntityCommit(params: {
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

  updateEntityCommitMeta(params: {
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

  getEntityState(params: {
    workspaceId: string,
    projectId: string,
    branchId: string,
    entityId: string | string[]
  }): Promise<DataWithCursor<IPopulatedEntityState>> {
    return this.instance.get(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/state`, {
      params: { entityId: params.entityId },
    })
  }

  getChangesInBranch(params: {
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

  getConflicts(params: {
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

  merge(params: {
    workspaceId: string,
    projectId: string,
    payload: {
      projectBranchFrom: string,
      projectBranchTo: string,
      workspaceUsers: string[],
      entityCommits?: string[],
      excludedEntities?: string[]
    }
  }): Promise<Omit<ICommit, 'entityCommits'> & { entityCommits: IEntityCommit[] }> {
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

  createEdge(platformEntityId: string, projectBranchId: string, payload: {
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

  deleteEdges(params: {
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
    workspaceUsers: string[],
    branchId: string;
    entityId: string;
    projectId: string;
    workspaceId: string,
    gitRefBranch?: string;
    metadata?: Record<string, string>,
    key?: string
  }): Promise<{ entity: IEntity }> {
    return this.instance.patch(`/workspaces/${params.workspaceId}/projects/${params.projectId}/branches/${params.branchId}/entities/${params.entityId}`, {
      gitRefBranch: params.gitRefBranch,
      metadata: params.metadata,
      key: params.key,
      workspaceUsers: params.workspaceUsers,
    })
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
