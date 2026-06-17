import { EntityType } from './enums'

export interface IEntityContent {
  _id: string
  entityId: string
  workspace: string
  project: string
  projectBranch: string
  type: EntityType
  data: any
}