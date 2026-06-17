import { VariableGroupData } from '@multiplayer/types'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 1
export const empty = (name = '', summaryToOverride?: Record<string, any>): VariableGroupData => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  id: 'main',
  groups: {},
  variables: {},
})
