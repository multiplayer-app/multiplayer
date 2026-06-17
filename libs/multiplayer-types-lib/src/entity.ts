import {
  EntityType,
  EntityCommitChangeType,
} from './enums'
import { IGitRef } from './git-ref'
import { ITag } from './tag'
import { IAccess } from './access'

export interface IEntity {
  entityId: string
  workspace: string
  project: string
  projectBranch: string
  type: EntityType
  default?: boolean
  key: string
  keyAliases: string[]
  hostnames?: string[]
  tags: ITag[]
  gitRef?: IGitRef
  sourceUri?: string
  archived?: boolean
  typeOfChangeInBranch?: EntityCommitChangeType
  metadata?: Record<string, any>
  latestEntityCommit: string
  createdAtCommit: string
  archivedAtCommit?: string
  deletedAtCommit?: string

  access: IAccess

  createdAt?: string | Date
  updatedAt?: string | Date
}

export const EntityTypeToNameMap = {
  [EntityType.PLATFORM_COMPONENT]: 'Platform Component',
  [EntityType.ENVIRONMENT]: 'Environment',
  [EntityType.PLATFORM]: 'Platform',
  [EntityType.NOTEBOOK]: 'Notebook',
  [EntityType.SCHEMA]: 'Schema',
  [EntityType.SKETCH]: 'Sketch',
  [EntityType.EXCALIDRAW]: 'Sketch',
  [EntityType.FILE]: 'Source',
  [EntityType.API]: 'API',
  [EntityType.VARIABLE_GROUP]: 'Variable Group',
}
