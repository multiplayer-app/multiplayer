export enum CommitType {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  MERGE = 'MERGE',
}

export interface ICommit {
  _id: string
  workspace: string
  project: string
  projectBranch: string
  type: CommitType
  workspaceUsers?: string[]
  entityCommits: string[]
  message: string
  label: string
  parentCommit?: string
  mergeFromBranch?: string
  mergeFromCommit?: string
  createdAt: string | Date
  updatedAt: string | Date
}
