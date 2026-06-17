import {
  DEFAULT_LAYOUT,
  Platform,
  VisualizationType,
} from '@multiplayer/types'
import { EntityDataTemplate } from './entity-data.template'

export const CURRENT_VERSION = 7
export const empty = (
  name = '',
  summaryToOverride?: Record<string, any>,
): Platform => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  metadata: {
    defaultView: '_all',
    layout: { ...DEFAULT_LAYOUT },
  },
  radar: {
    enabled: true,
    linkEnabled: true,
    ignoredDetections: [],
  },
  edges: {},
  groups: {},
  components: {},
  views: {
    _all: {
      id: '_all',
      name: 'All',
      visualizations: {
        [VisualizationType.DIAGRAM]: {},
      },
    },
  },
})
