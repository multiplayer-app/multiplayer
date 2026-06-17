import { SystemTag } from './enums'
import { ITag } from './tag'

export interface IEnvironment {
  _id: string
  environmentId: string
  workspace: string
  project: string
  projectBranch: string

  name: string
  tags: ITag[]
  systemTags: SystemTag[]

  createdAt?: string | Date
  updatedAt?: string | Date
  archived?: boolean
  createdAtCommit: string
  archivedAtCommit?: string
  deletedAtCommit?: string
}
