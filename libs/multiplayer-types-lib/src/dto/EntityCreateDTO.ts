import { EntityType } from '../enums'
import { IGitRef } from '../git-ref'
import { IEntity } from '../entity'
import { IEntityCommit } from '../entity-commit'
import { ICommit } from '../commit'

export interface EntityCreateRequest {
  type: EntityType
  key: string
  gitRef?: IGitRef
  metadata?: Record<string, string>
  keyAliases?: string[]
  sourceUri?: string
}

export interface EntityCreateResponse {
  entity: IEntity
  entityCommit: IEntityCommit
  commit: ICommit
}
