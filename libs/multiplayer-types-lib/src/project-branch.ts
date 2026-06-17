import { IWorkspaceUser } from './workspace-user'
import { ProjectBranchReviewState } from './enums'
import { IEntity } from './entity'
import { IEntityCommit } from './entity-commit'
import { IThread } from './thread'
import { IComment } from './comment'

export enum ProjectBranchStatus {
  TO_REVIEW = 'TO_REVIEW',
  CHANGE_REQUESTED = 'CHANGE_REQUESTED',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_DEVELOPMENT = 'IN_DEVELOPMENT',
  MERGED = 'MERGED',
  CLOSED = 'CLOSED',
  APPROVED = 'APPROVED',
  DRAFT = 'DRAFT'
}

export enum ProjectBranchType {
  FEATURE = 'FEATURE',
  CHANGE = 'CHANGE',
  BUGFIX = 'BUGFIX',
}

export interface IBranchReview {
  _id: string
  workspaceUser: string | IWorkspaceUser
  state: ProjectBranchReviewState,
  thread?: string
  createdAt: string | Date
  updatedAt: string | Date
}

export interface IProjectBranch {
  _id: string
  workspace: string
  project: string
  name: string
  type: ProjectBranchType
  status: ProjectBranchStatus
  parentProjectBranch?: string
  parentCommit?: string
  archived?: boolean
  default?: boolean
  lastCommitMeta: {
    workspaceUsers: string[] | IWorkspaceUser
    date: string | Date
  }
  reviews: IBranchReview[]
  defaultGitBranchName: string
  gitBranches: Record<string, string>
  createdAt: string | Date
  updatedAt: string | Date
}

export interface IProjectBranchChanges {
  entity: IEntity
  entityCommit: IEntityCommit
}

export interface IProjectBranchConflicts {
  entity: IEntity
  baseEntityCommit: IEntityCommit
  entityCommitFrom: IEntityCommit
  entityCommitTo: IEntityCommit
}

export type ListBranchReviewsResponse = Omit<IBranchReview, 'thread'> & {
  thread?: IThread & { comments: IComment[] }
}
