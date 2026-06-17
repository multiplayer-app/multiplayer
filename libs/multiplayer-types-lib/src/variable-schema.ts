import {
  VariableSchemaType,
  VariableSchemaEntityType,
} from './enums'

export interface IVariableSchema {
  _id: string
  variableSchemaId: string
  workspace: string
  project: string
  projectBranch: string

  entity: string
  entityType: VariableSchemaEntityType
  type: VariableSchemaType

  name: string
  description: string
  defaultValue: string
  required: boolean

  createdAt?: string | Date
  updatedAt?: string | Date
  archived?: boolean
  createdAtCommit: string
  archivedAtCommit?: string
  deletedAtCommit?: string
}
