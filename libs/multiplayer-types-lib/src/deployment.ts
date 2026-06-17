export interface IDeployment {
  _id: string
  workspace: string
  project: string
  entity: string
  release?: string
  environment?: string
  createdAt: string
  updatedAt: string
}
