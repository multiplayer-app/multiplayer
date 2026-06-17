import {
  ProjectLinkObjectType,
  EntityType,
} from './enums'
import { IGitRef } from './git-ref'
// import { IEntity } from './entity'

export interface IProjectLink {
  _id: string

  projectLinkId: string

  workspace: string
  project: string
  projectBranch: string

  sourceObjectType: ProjectLinkObjectType

  sourceObject?: string
  sourceUri?: string
  sourceGitRef?: IGitRef

  targetObject: string
  targetObjectType: ProjectLinkObjectType

  createdAtCommit: string
  archivedAtCommit?: string
  deletedAtCommit?: string | null

  sourceEntityType?: EntityType
  targetEntityType?: EntityType

  createdAt?: string | Date
  updatedAt?: string | Date
}
