export interface IPlatformRelation {
  _id: string
  workspace: string
  project: string
  projectBranch: string
  parentEntity: string
  sourceEntity: string
  targetEntity: string
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}
