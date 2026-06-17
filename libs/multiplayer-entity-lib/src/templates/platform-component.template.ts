import {
  ComponentType,
  PlatformComponent,
  PlatformComponentOwner,
  EntityVisibility,
} from '@multiplayer/types'
import * as BlocknoteTemplates from './blocknote.template'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 1
export const empty = (name = '', summaryToOverride?: Record<string, any>): PlatformComponent => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  information: {
    type: summaryToOverride?.type || ComponentType.GENERIC,
    visibility: summaryToOverride?.visibility || EntityVisibility.PRIVATE,
    owner: summaryToOverride?.owner || PlatformComponentOwner.INTERNAL,
    slug: summaryToOverride?.slug || '',
    shortDescription: summaryToOverride?.shortDescription || '',
    color: summaryToOverride?.color || '',
    iconUrl: summaryToOverride?.iconUrl || '',
  },
  environmentVariables: {},
})
