// import { EntityTypeEnum } from './enums/entity-type.enum'
import { IEntityCommit } from './entity-commit'
// import { EntityCommitChangeTypeEnum } from './enums'
import { IEntity } from './entity'

export interface IEntityState {
  entity: string
  entityCommit: string
}

export interface IPopulatedEntityState {
  entity: IEntity
  entityCommit: IEntityCommit
}

export interface IProjectBranchState {
  _id: string
  project: string
  branch: string
  commit: string
  entities: IEntityState[]
  createdAt: string | Date
  updatedAt: string | Date
}
