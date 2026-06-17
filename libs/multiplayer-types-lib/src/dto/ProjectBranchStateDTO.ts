import { EntityCommitChangeType, EntityType } from '../enums'
import { IListResponse } from './IListResponse'
import { IEntityCommit } from '../entity-commit'
import { IEntity } from '../entity'

export interface ProjectBranchStateParams {
  archived?: boolean
  limit?: number
  skip?: number
  commit?: string
  entityType?: EntityType
  changeType?: EntityCommitChangeType
  entityId?: string | string[]
  key?: string
  sortDirection?: 1 | -1
  sortKey?: string
  hasUncommittedSource?: boolean
}

export type ProjectBranchStateResponse = IListResponse<{
  entity: IEntity
  entityCommit: IEntityCommit
}>
