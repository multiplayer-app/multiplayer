import {
  CommitType,
  CopyEntityParams,
  EntityCommitChangeType,
  EntityCommitMeta,
  EntityCommitMetaUpdatePayload,
  EntityCommitStatus,
  EntityCommitStorageType,
  EntityType,
  IEntity,
  IEntityCommit,
  IGitRef,
  IPopulatedEntityState,
  ResetEntityParams,
  Resolution,
  SourceData,
} from '@multiplayer/types'
import logger, { asyncLogError } from '@multiplayer/logger'
import {
  BadRequestError,
  InternalError,
  InternalServerError,
  NotFoundError,
} from 'restify-errors'
import * as Y from 'yjs'
import { s3 } from '@multiplayer/s3'
import { EntityConverter, EntityDiffPatch } from '@multiplayer/entity'
import { GitService } from '../services/git-service-internal'
import { InternalVersionService } from '../services/version-service-internal'

export class VersionController {
  private versionService: InternalVersionService
  private gitService: GitService
  private readonly workspaceId: string
  private readonly projectId: string

  constructor(workspaceId: string, projectId: string) {
    this.workspaceId = workspaceId
    this.projectId = projectId
    this.versionService = new InternalVersionService()
    this.gitService = new GitService()
  }

  async updateEntityCommit(
    workspaceUsers: string[],
    entityId: string,
    branchId: string,
    metaPayload: EntityCommitMetaUpdatePayload,
  ) {
    try {
      const state = await this.getLatestState(branchId, entityId)
      const entityCommit = await this.versionService.updateEntityCommitMeta({
        workspaceId: this.workspaceId,
        projectId: this.projectId,
        branchId,
        entityId,
        entityCommitId: state.entityCommit._id,
        metaPayload,
      })
      await this.versionService.createCommit({
        workspaceId: this.workspaceId,
        projectId: this.projectId,
        branchId,
        payload: {
          message: 'auto save',
          label: 'auto',
          type: CommitType.AUTO,
          entityCommits: [
            entityCommit._id,
          ],
          workspaceUsers,
        },
      })
      return { entityCommit, entity: state.entity }
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async commitEntityChanges({
    branchId,
    entityId,
    entityCommitType,
    payload,
    message = 'auto save',
    label = 'auto',
    commitType = CommitType.AUTO,
    workspaceUsers,
    summary = {},
  }: {
    branchId: string,
    entityId: string,
    entityCommitType: EntityCommitChangeType,
    payload: Uint8Array,
    message?: string,
    label?: string,
    commitType?: CommitType,
    workspaceUsers: string[]
    summary: Record<string, string>
  }) {
    let meta: EntityCommitMeta = {}
    try {
      const state = await this.getLatestState(branchId, entityId)
      meta = state.entityCommit?.meta || {}
    } catch (err) {
      if (!(err instanceof NotFoundError)) throw err
    }

    meta.summary = summary

    let entityCommit = await this.versionService.createEntityCommit({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId,
      entityId,
      payload: {
        changeType: entityCommitType,
        storageType: EntityCommitStorageType.S3,
        meta,
      },
    })
    if (!entityCommit.key || !entityCommit.bucket) {
      throw new InternalError('Insufficient commit data')
    }

    await s3.uploadFile(entityCommit.key, entityCommit.bucket, payload)
    entityCommit = await this.versionService.updateEntityCommit({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId,
      entityId,
      entityCommitId: entityCommit._id,
      status: EntityCommitStatus.DONE,
    })

    await this.versionService.createCommit({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId,
      payload: {
        message,
        label,
        type: commitType,
        entityCommits: [
          entityCommit._id,
        ],
        workspaceUsers,
      },
    })
    return entityCommit
  }

  async updateEntitySource(entityId: string, branchId: string, storageType: EntityCommitStorageType, workspaceUsers: string[]) {
    try {
      let meta: EntityCommitMeta = {}
      try {
        const state = await this.getLatestState(branchId, entityId)
        meta = state.entityCommit?.meta || {}
      } catch (err) {
        if (!(err instanceof NotFoundError)) throw err
      }

      const entityCommit = await this.versionService.createEntityCommit({
        workspaceId: this.workspaceId,
        projectId: this.projectId,
        branchId, entityId, payload: {
          changeType: EntityCommitChangeType.UPDATE,
          storageType,
          meta,
        },
      })
      await this.versionService.createCommit({
        workspaceId: this.workspaceId,
        projectId: this.projectId,
        branchId,
        payload: {
          message: 'update source',
          label: 'auto',
          type: CommitType.AUTO,
          entityCommits: [
            entityCommit._id,
          ],
          workspaceUsers,
        },
      })

    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async deleteEntity(workspaceUsers: string[], branchId: string, entityId: string) {
    try {
      const entityCommitResponse = await this.versionService.createEntityCommit({
        workspaceId: this.workspaceId,
        projectId: this.projectId, branchId, entityId, payload: {
          changeType: EntityCommitChangeType.DELETE,
        },
      })
      return this.versionService.createCommit({
        workspaceId: this.workspaceId,
        projectId: this.projectId, branchId, payload: {
          message: 'delete entity',
          type: CommitType.AUTO,
          entityCommits: [
            entityCommitResponse._id,
          ],
          workspaceUsers,
        },
      })
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async getLatestState(branchId: string, entityId: string): Promise<IPopulatedEntityState> {
    try {
      const entityStateResponse = await this.versionService.getEntityState({
        branchId,
        entityId,
        workspaceId: this.workspaceId,
        projectId: this.projectId,
      })
      if (!entityStateResponse?.data?.length) {
        throw new NotFoundError(`${entityId} entity document not found in branch ${branchId}`)
      }

      return entityStateResponse.data[0]
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async getChangesInBranch(
    branchId: string,
    filter: {
      entityId?: string,
      entityType?: EntityType,
      commit?: string
    },
  ) {
    const projectBranchChanges = await this.versionService.getChangesInBranch({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId,
      filter,
    })

    return projectBranchChanges.data
  }

  async getEntitySnapshotFromS3(entityCommit: IEntityCommit) {
    const { key, bucket } = entityCommit

    if (!key || !bucket) {
      throw new InternalError('Not enough records to find entity document')
    }
    return s3.downloadFileAsByteArray(key, bucket)
  }

  async getEntitySnapshotFromGit(entity: IEntity) {
    if (!entity.gitRef) {
      throw new InternalError('Not enough records to find entity document')
    }
    const contents = await this.gitService.getContents(entity.gitRef, entity.project, entity.workspace)
    const extension = entity.gitRef.path ? entity.gitRef.path.split('.').pop()?.toLowerCase() : 'txt'

    return EntityConverter.convertSourceToState(entity.type, entity.key, contents.toString(), extension)
  }

  async getEntitySnapshot(entityCommit: IEntityCommit, entity: IEntity): Promise<Uint8Array | undefined> {
    try {
      if (entityCommit.storageType === EntityCommitStorageType.S3) {
        return this.getEntitySnapshotFromS3(entityCommit)
      }

      if (entityCommit.storageType === EntityCommitStorageType.GIT && entity.gitRef) {
        return this.getEntitySnapshotFromGit(entity)
      }
      return undefined
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async updateBranch(params: {
    baseBranch: string,
    branchToUpdate: string,
    initiatorId: string,
    resolutions?: Record<string, Resolution>
  }) {
    const { baseBranch, branchToUpdate, initiatorId, resolutions } = params
    const conflicts = await this.versionService.getConflicts({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      projectBranchFrom: branchToUpdate,
      projectBranchTo: baseBranch,
    })
    if (!conflicts.commits.length && !conflicts.aliases.length) {
      return
    }
    if (!resolutions) {
      throw new BadRequestError('Some resolutions are missed')
    }

    const hasUnresolved = conflicts.commits.some((conflict) => {
      if (!resolutions[conflict.entity.entityId]) return true
      const entityCommitId = resolutions[conflict.entity.entityId].entityCommitId

      // check if latest entityCommits are used in resolutions
      return entityCommitId
        && entityCommitId !== conflict.entityCommitFrom._id.toString()
        && entityCommitId !== conflict.entityCommitTo._id.toString()
    })

    if (hasUnresolved) {
      throw new BadRequestError('Some resolutions are missed')
    }

    const resolvedEntityCommits = await Promise.all(Object.keys(resolutions).map((entityId) => {
      const conflict = conflicts.commits.find(({ entity }) => entity.entityId === entityId)
      if (!conflict) return undefined

      const resolution = resolutions[entityId]
      if (resolution.patch) {
        return this.resolveConflictByPatch(conflict, resolution.patch, branchToUpdate, initiatorId)
      }
      if (resolution.entityCommitId && resolution.entityCommitId === conflict.entityCommitTo._id) {
        return this.resolveConflictByEntityCommitCopy(conflict, branchToUpdate, initiatorId)
      }
      return resolutions[entityId].entityCommitId
    }))

    const entityCommitIds = resolvedEntityCommits.filter((value) => value) as string[]

    return this.versionService.merge({
      workspaceId: this.workspaceId,
      projectId: this.projectId, payload: {
        projectBranchFrom: baseBranch,
        projectBranchTo: branchToUpdate,
        workspaceUsers: [initiatorId],
        entityCommits: entityCommitIds,
      },
    })
  }
  async merge(params: {
    projectBranchFrom: string,
    projectBranchTo: string,
    initiatorId: string,
    excludedEntities?: string[]
  }) {
    const { projectBranchFrom, projectBranchTo, initiatorId, excludedEntities } = params
    const conflicts = await this.versionService.getConflicts({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      projectBranchFrom,
      projectBranchTo,
    })
    if (conflicts.commits.length) {
      throw new BadRequestError('Update feature branch')
    }
    if (conflicts.aliases.length) {
      throw new BadRequestError('Resolve alias conflicts')
    }
    return this.versionService.merge({
      workspaceId: this.workspaceId,
      projectId: this.projectId, payload: {
        projectBranchFrom,
        projectBranchTo,
        workspaceUsers: [initiatorId],
        excludedEntities,
      },
    })
  }

  private async resolveConflictByPatch(
    conflict: { entity: IEntity, baseEntityCommit: IEntityCommit },
    patch: any,
    branchToUpdate: string,
    initiatorId: string): Promise<string> {

    const state = await this.getEntitySnapshot(conflict.baseEntityCommit, conflict.entity)
    if (!state) {
      return Promise.reject(new InternalServerError('Cannot find state for the base commit'))
    }
    const patchedState = EntityDiffPatch.applyPatchToTheYState(conflict.entity.type, state, patch)
    const entityCommit = await this.commitEntityChanges({
      entityId: conflict.entity.entityId,
      branchId: branchToUpdate,
      entityCommitType: EntityCommitChangeType.UPDATE,
      message: 'resolve merge conflict',
      label: 'conflict',
      commitType: CommitType.AUTO,
      payload: patchedState,
      workspaceUsers: [initiatorId],
      summary: EntityConverter.getSummaryFromState(conflict.entity.type, patchedState),
    })
    return entityCommit._id.toString()
  }

  private async resolveConflictByEntityCommitCopy(conflict: {
    entity: IEntity;
    entityCommitTo: IEntityCommit;
  },
  branchToUpdate: string,
  initiatorId: string): Promise<string> {
    const state = await this.getEntitySnapshot(conflict.entityCommitTo, conflict.entity)
    if (!state) {
      return Promise.reject(new InternalServerError('Cannot find state for the resolution commit'))
    }
    const entityCommit = await this.commitEntityChanges({
      entityId: conflict.entity.entityId,
      branchId: branchToUpdate,
      entityCommitType: EntityCommitChangeType.UPDATE,
      message: 'resolve merge conflict',
      label: 'conflict',
      commitType: CommitType.AUTO,
      payload: state,
      workspaceUsers: [initiatorId],
      summary: conflict.entityCommitTo.meta.summary || {},
    })
    return entityCommit._id.toString()
  }

  @asyncLogError
  public async commitEntitiesToGit(params: {
    entityIds: string[],
    branchId: string,
    commitMessage: string,
    workspaceUser: string,
  }) {
    const projectBranch = await this.versionService.getProjectBranch({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId: params.branchId,
    })

    if (!projectBranch) {
      throw new NotFoundError('Project branch not found')
    }
    const gitBranchesMap = projectBranch?.gitBranches
    const entitiesState = await this.versionService.getEntityState({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId: params.branchId,
      entityId: params.entityIds[0],
    })
    if (entitiesState.data.length === 0) {
      throw new NotFoundError(`${params.entityIds} entity document not found in branch ${params.branchId}`)
    }

    const groupEntitiesByRepo = entitiesState.data
      .filter(({ entity, entityCommit }) => entity.gitRef && entityCommit.storageType === EntityCommitStorageType.S3)
      .reduce((acc, item) => {
        const gitRef = item.entity.gitRef as IGitRef
        if (!acc[gitRef.repositoryId]) acc[gitRef.repositoryId] = []
        acc[gitRef.repositoryId].push(item)
        return acc
      }, {} as Record<string, IPopulatedEntityState[]>)

    if (Object.keys(groupEntitiesByRepo).length === 0) {
      throw new BadRequestError('Nothing to commit')
    }
    //check if projectBranch has default values
    const missedRepoId = Object.keys(groupEntitiesByRepo).find((repositoryId) => !gitBranchesMap[repositoryId])
    if (missedRepoId) {
      const entityNames = groupEntitiesByRepo[missedRepoId].map(({ entity }) => entity.key)
      throw new BadRequestError(`${entityNames} do not have branch mapped to their repository `)
    }

    await Promise.all(Object.keys(groupEntitiesByRepo).map((gitRepositoryId) =>
      Promise.all(groupEntitiesByRepo[gitRepositoryId].map(async (state) => {
        const { entity, entityCommit } = state
        const contents = await this.getEntitySnapshotFromS3(entityCommit)
        if (!contents) {
          throw new BadRequestError('Nothing to commit')
        }
        const parsed = EntityConverter.convertStateToData(entity.type, contents) as SourceData
        return {
          action: 'update',
          filePath: entity.gitRef?.path || '',
          content: parsed.contents,
        }
      })).then((contents) =>
        this.gitService.commit({
          gitRepositoryId,
          gitBranch: gitBranchesMap[gitRepositoryId],
          contents,
          workspaceId: this.workspaceId,
          projectId: this.projectId,
          commitMessage: params.commitMessage,
        })),
    ))

    await Promise.all(Object.keys(groupEntitiesByRepo).map(async (repositoryId) => {
      const entities = groupEntitiesByRepo[repositoryId]
      await Promise.all(entities.map(({ entity }) => this.updateEntity({
        workspaceUsers: [params.workspaceUser],
        gitRefBranch: gitBranchesMap[repositoryId],
        branchId: params.branchId,
        entityId: entity.entityId,
      })))
      await Promise.all(entities.map(({ entity }) =>
        this.updateEntitySource(entity.entityId, params.branchId, EntityCommitStorageType.GIT, [params.workspaceUser]),
      ))
    }))
  }

  public updateEntity(params:{
    workspaceUsers: string[],
    branchId: string,
    entityId: string,
    gitRefBranch?: string,
    metadata?: Record<string, string>,
    key?: string,
  }) {
    return this.versionService.updateEntity({
      workspaceUsers: params.workspaceUsers,
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      gitRefBranch: params.gitRefBranch,
      branchId: params.branchId,
      entityId: params.entityId,
      metadata: params.metadata,
      key: params.key,
    })
  }

  async createLink(projectId: string, projectBranchId: string, sourceEntityId: string, targetEntityId: string): Promise<any> {
    return this.versionService.createLink({
      projectId,
      projectBranchId,
      sourceEntityId,
      targetEntityId,
      workspaceId: this.workspaceId,
    })
  }

  async deleteLink(branchId: string, sourceEntityId: string, targetEntityId: string): Promise<any> {
    return this.versionService.deleteLink({
      branchId,
      sourceEntityId,
      targetEntityId,
      workspaceId: this.workspaceId,
      projectId: this.projectId,
    })
  }
  async createEdge(platformEntityId: string, branchId: string, payload: {
    workspace: string,
    project: string,
    sourceEntity: string,
    targetEntity: string
  }): Promise<any> {
    return this.versionService.createEdge(platformEntityId, branchId, payload)
  }
  async deleteRelatedEdges(platformEntityId: string, projectBranchId: string, entityId: string): Promise<any> {
    return this.versionService.deleteEdges({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      platformEntityId,
      projectBranchId,
      filter: { sourceEntity: entityId },
    })
  }

  async deleteEdge(platformEntityId: string, projectBranchId: string, sourceEntityId: string, targetEntityId: string): Promise<any> {
    return this.versionService.deleteEdges({
      platformEntityId,
      projectBranchId,
      filter: { sourceEntity: sourceEntityId, targetEntity: targetEntityId },
      workspaceId: this.workspaceId,
      projectId: this.projectId,
    })
  }

  async resetEntity(params: ResetEntityParams, workspaceUserId: string) {
    const resetEntityCommit = await this.versionService.resetEntityCommit({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      entityId: params.entityId,
      projectBranchId: params.branchId,
      entityCommitId: params.entityCommitId,
    })

    await this.versionService.createCommit({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId: params.branchId,
      payload: {
        message: 'Reverting changes',
        label: 'revert',
        type: CommitType.AUTO,
        entityCommits: [
          resetEntityCommit._id,
        ],
        workspaceUsers: [workspaceUserId],
      },
    })
    return resetEntityCommit
  }

  async copyEntity(params: CopyEntityParams, workspaceUserId: string) {
    const data = await this.versionService.copyEntity({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      entityId: params.entityId,
      projectBranchId: params.branchId,
      entityCommitId: params.entityCommitId,
      entityName: params.entityName,
    })

    await this.versionService.createCommit({
      workspaceId: this.workspaceId,
      projectId: this.projectId,
      branchId: params.branchId,
      payload: {
        message: 'Reverting changes',
        label: 'revert',
        type: CommitType.AUTO,
        entityCommits: [
          data.entityCommit._id,
        ],
        workspaceUsers: [workspaceUserId],
      },
    })
    return data
  }
}
