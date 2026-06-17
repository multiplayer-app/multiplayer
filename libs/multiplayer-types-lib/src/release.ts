export interface IRelease {
  _id: string
  workspace: string
  project: string
  entity: string
  version: string

  commitHash?: string
  repositoryUrl?: string

  releaseNotes?: string

  sourceMap?: {
    bucket: string
    key: string
  }

  createdAt: string
  updatedAt: string
}
