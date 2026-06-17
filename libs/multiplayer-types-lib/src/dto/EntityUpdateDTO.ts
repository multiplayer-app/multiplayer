import { IEntity } from '../entity'
import { IEntityCommit } from '../entity-commit'
import { ITag } from '../tag'

export interface EntityUpdateRequest {
  key?: string
  gitRefBranch?: string
  metadata?: Record<string, string>
  keyAliases?: string[]
  tags?: ITag[]
  archived?: boolean
}

export interface EntityUpdateResponse {
  entity: IEntity,
  entityCommit?: IEntityCommit
}
