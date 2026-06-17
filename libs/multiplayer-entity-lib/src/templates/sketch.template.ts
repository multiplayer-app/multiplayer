import { SketchData } from '@multiplayer/types'
import { EntityDataTemplate } from './entity-data.template'
export const CURRENT_VERSION = 1
export const empty = (name = '', summaryToOverride?: Record<string, string>): SketchData => ({
  ...EntityDataTemplate.empty(name, CURRENT_VERSION, summaryToOverride),
  'tldrawFileFormatVersion': 1,
  'schema': {
    'schemaVersion': 1,
    'storeVersion': 1,
    'recordVersions': {
      'asset': {
        'version': 0,
        'subTypeKey': 'type',
        'subTypeVersions': {
          'image': 2,
          'video': 2,
          'bookmark': 0,
        },
      },
      'page': {
        'version': 0,
      },
      'shape': {
        'version': 1,
        'subTypeKey': 'type',
        'subTypeVersions': {
          'draw': 1,
          'text': 1,
          'line': 0,
          'arrow': 1,
          'image': 2,
          'video': 1,
          'geo': 3,
          'note': 2,
          'group': 0,
          'bookmark': 1,
          'embed': 1,
          'frame': 0,
        },
      },
      'user': {
        'version': 0,
      },
      'user_document': {
        'version': 2,
      },
      'user_presence': {
        'version': 1,
      },
    },
  },
  'records': [],
})
