import {
  EntityType,
  EntityCommitChangeType,
  EntityCommitStatus,
} from './enums'

export enum EntityCommitStorageType {
  S3 = 'S3',
  GIT = 'GIT'
}

export interface EntityCommitMeta {
  entityName?: string
  links?: string[]
  summary?: Record<string, string>
}

export interface EntityCommitMetaUpdatePayload {
  entityName?: string
  summary?: Record<string, string>
}

export interface IEntityCommit {
  _id: string | any
  workspace: string
  project: string
  projectBranch: string
  changeType: EntityCommitChangeType
  status: EntityCommitStatus
  entity: string | any
  entityType: EntityType
  baseEntityCommit?: string
  bucket?: string
  key?: string
  commit?: string | any
  linkedToCommit: boolean,
  parentEntityCommit?: string | any
  meta: EntityCommitMeta
  storageType: EntityCommitStorageType
  name?: string
  createdAt: string | Date
  updatedAt: string | Date
}

export type IEntityCommitCreateResponse = IEntityCommit & {
  url: string
}
