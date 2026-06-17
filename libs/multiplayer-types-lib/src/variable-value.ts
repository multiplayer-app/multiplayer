export interface IVariableValue {
  _id: string
  variableValueId: string
  workspace: string
  project: string
  projectBranch: string

  entity: string
  environment: string
  variableSchema: string

  value: string // TODO - add hash to find changed var values

  createdAt?: string | Date
  updatedAt?: string | Date
  archived?: boolean
  createdAtCommit: string
  archivedAtCommit?: string
  deletedAtCommit?: string
}
