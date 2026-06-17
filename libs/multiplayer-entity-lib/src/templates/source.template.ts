import { SourceData } from '@multiplayer/types'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 1
export const empty = (name = '', summaryToOverride?: Record<string, any>): SourceData => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  contents: summaryToOverride?.contents || '',
  extension: summaryToOverride?.extension || 'txt',
})
