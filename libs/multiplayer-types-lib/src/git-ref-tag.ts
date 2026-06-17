import { IGitRef } from './git-ref'
import {
  SystemTag,
  GitRefTagType,
} from './enums'
import { ITag } from './tag'

export interface IGitRefTag {
  _id: string

  gitRefTagId: string

  workspace: string
  project: string
  projectBranch: string

  type: GitRefTagType
  gitRef?: IGitRef

  tags: ITag[]
  systemTags: SystemTag[]

  createdAtCommit: string
  archivedAtCommit?: string
  deletedAtCommit?: string

  createdAt?: string | Date
  updatedAt?: string | Date
}
