import { EntityVisibility, EnvironmentData, EnvironmentType } from '@multiplayer/types'
import * as BlocknoteTemplates from './blocknote.template'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 1
export const empty = (name = '', summaryToOverride?: Record<string, any>): EnvironmentData => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  information: {
    type: summaryToOverride?.type || EnvironmentType.K8S,
    slug: summaryToOverride?.slug || '',
    shortDescription: '',
    visibility: EntityVisibility.PRIVATE,
  },
})
