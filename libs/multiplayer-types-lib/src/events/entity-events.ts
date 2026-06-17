import { IEntity } from '../entity'
import { EntityType } from '../enums'
import { WSCallback } from './callback-data'
import { IEntityCommit } from '../entity-commit'
import { IGitRef } from '../git-ref'
import { ICommit } from '../commit'
import { EntityCreateResponse } from '../dto'
import { ITag } from '../tag'

export enum EntityEvents {
  ENTITY_CREATE= 'v0/entity/create',
  ENTITY_DELETE= 'v0/entity/delete',
  ENTITY_COMMIT= 'v0/entity/commit',
  ENTITY_UPDATE = 'v0/entity/update',
  ENTITY_GIT_COMMIT = 'v0/entity/git-commit',
  ENTITY_RESET = 'v0/entity/reset',
  ENTITY_COPY = 'v0/entity/copy',
}

export interface ResetEntityParams {
  entityId: string
  branchId: string
  entityCommitId: string
}

export interface CopyEntityParams {
  entityId: string
  branchId: string
  entityCommitId: string
  entityName?: string
}

export interface CreateEntityParams {
  key: string,
  type: EntityType,
  branchId: string,
  gitRef?: IGitRef,
  sourceUri?: string,
  tags?: ITag[],
  metaSummary?: Record<string, string>
}

export interface UpdateEntityParams {
  entityId: string,
  branchId: string,
  entityName?: string
  summary?: Record<string, string>
}

export interface CommitEntityParams {
  entityId: string,
  branchId: string,
  message: string,
  label: string
}
export interface DeleteEntityParams {
  entityId: string,
  branchId: string,
}
export interface GitCommitEntityParams {
  entityIds: string[],
  branchId: string,
  commitMessage?: string,
}

export type EntityEventsMap = {
  [EntityEvents.ENTITY_CREATE]: (params: CreateEntityParams, callback?: WSCallback<Omit<EntityCreateResponse, 'commit'>>)=> void
  [EntityEvents.ENTITY_DELETE]: (params: DeleteEntityParams, callback?: WSCallback<void>) => void
  [EntityEvents.ENTITY_COMMIT]: (params: CommitEntityParams, callback?: WSCallback<void>) => void
  [EntityEvents.ENTITY_RESET]: (params: ResetEntityParams, callback?: WSCallback<void>) => void
  [EntityEvents.ENTITY_COPY]: (params: CopyEntityParams, callback?: WSCallback<Omit<EntityCreateResponse, 'commit'>>) => void
  [EntityEvents.ENTITY_GIT_COMMIT]: (params: GitCommitEntityParams, callback?: WSCallback<void>) => void
}

export type EntityServerEventsMap = {
  [EntityEvents.ENTITY_CREATE]: (entity: Omit<EntityCreateResponse, 'commit'>) => void
  [EntityEvents.ENTITY_DELETE]: (data: { entityId: string, branchId: string }) => void
  [EntityEvents.ENTITY_UPDATE]: (entity: IEntity) => void
  [EntityEvents.ENTITY_COMMIT]: (entityCommit: Omit<IEntityCommit, 'commit'> & { commit: ICommit }) => void
}
