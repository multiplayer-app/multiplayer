import { ExcalidrawData } from '@multiplayer/types'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 1

export const sketchTemplate = () => ({
  elements: [],
  files: {},
})

export const empty = (name = '', summaryToOverride?: Record<string, any>): ExcalidrawData => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  ...sketchTemplate(),
})
