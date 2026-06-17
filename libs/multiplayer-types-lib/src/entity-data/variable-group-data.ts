import { EntityData, EntityInformation } from './entity-data'

export interface Variable {
  id: string
  name: string
  description?: string
  secret: boolean
  value?: string
}

export interface VariableGroup {
  id: string
  name: string
  variables?: Record<string, Variable>
  groups?: Record<string, VariableGroup>
}

export interface VariableGroupMetadata extends EntityInformation {
  groups: string[] // names of top level groups
}

export type VariableGroupData = EntityData & VariableGroup