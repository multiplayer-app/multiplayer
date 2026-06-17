import FileConverter from '../src/converters/file.converter'
import SketchConverter from '../src/converters/sketch.converter'
import PlatformConverter from '../src/converters/platform.converter'
import BlocknoteConverter from '../src/converters/blocknote.converter'
import {
  Platform,
  Blocknote,
  EntityType,
  ComponentType,
  DEFAULT_LAYOUT, VisualizationType,
} from '@multiplayer/types'

import PlatformComponentConverter from '../src/converters/platform-component.converter'
import {
  BlocknoteTemplates,
  PlatformComponentTemplates,
  PlatformTemplates,
  SketchTemplates, SourceTemplates, VariableGroupTemplates,
} from '../src/templates'
import { convertDataToState, convertStateToData, getSummaryFromData } from '../src/converters'
import VariableGroupConverter from '../src/converters/variable-group.converter'
import { EntityConverter } from '../src'

function getMockDescription() {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: {
          textAlignment: 'left',
          level: '1',
        },
        content: [
          {
            type: 'text',
            text: 'test',
          },
        ],
      },
    ],
  }
}
function getMockDocument() {
  return {
    ...BlocknoteTemplates.empty(),
    type: 'doc',
    environments: {
      [Blocknote.SourceEnv.GLOBAL]: {
        variables: [],
        secrets: [],
      },
    },
    content: [
      {
        type: 'heading',
        attrs: {
          textAlignment: 'left',
          level: '1',
        },
        content: [
          {
            type: 'text',
            text: 'test',
          },
        ],
      },
    ],
  }
}
function getMockPlatform(): Platform {
  return {
    ...PlatformTemplates.empty('test'),
    metadata: {
      layout: { ...DEFAULT_LAYOUT },
      defaultView: '_all',
    },
    edges: {
      'edge:qweeqweQ8kpvxI0anj-Ue': {
        id: 'edge:qweeqweQ8kpvxI0anj-Ue',
        source: 'component:Lvg-0g_Q8kpvxI0anj-ramp',
        target: 'component:awWHKkuRnbk9CzbWdXDIG',
      },
    },
    components: {
      'component:Lvg-0g_Q8kpvxI0anj-ramp': {
        id: 'component:Lvg-0g_Q8kpvxI0anj-ramp',
        type: ComponentType.SERVICE,
        name: 'RampWebApiService',
      },
      'component:awWHKkuRnbk9CzbWdXDIG': {
        id: 'component:awWHKkuRnbk9CzbWdXDIG',
        type: ComponentType.GENERIC,
        name: 'AWSS3',
      },
    },
    groups: {},
    views: {
      _all: {
        id: '_all',
        name: 'All',
        groups: [],
        components: [],
        visualizations: {
          [VisualizationType.DIAGRAM]: {
            'component:Lvg-0g_Q8kpvxI0anj-ramp': {
              x: 0,
              y: 0,
            },
            'component:awWHKkuRnbk9CzbWdXDIG': {
              x: 0,
              y: 1,
            },
          },
        },
      },
    },
  } as Platform
}
function getMockSketch() {
  return {
    ...SketchTemplates.empty('test'),
    tldrawFileFormatVersion: 1,
    schema: {
      schemaVersion: 1,
      storeVersion: 1,
      recordVersions: {
        asset: {
          version: 0,
          subTypeKey: 'type',
          subTypeVersions: {
            image: 2,
            video: 2,
            bookmark: 0,
          },
        },
        page: {
          version: 0,
        },
        shape: {
          version: 1,
          subTypeKey: 'type',
          subTypeVersions: {
            draw: 1,
            text: 1,
            line: 0,
            arrow: 1,
            image: 2,
            video: 1,
            geo: 3,
            note: 2,
            group: 0,
            bookmark: 1,
            embed: 1,
            frame: 0,
          },
        },
        user: {
          version: 0,
        },
        user_document: {
          version: 2,
        },
        user_presence: {
          version: 1,
        },
      },
    },
    records: [
      {
        x: 25.987575683593775,
        y: 154.2193896484375,
        z: 1,
        id: 'camera:ccJrSDXLxBeI_HGAs5ne2',
        typeName: 'camera',
      },
    ],
  }
}

describe('Entity conversions', () => {
  it('Blocknote convertYDocToData', () => {
    const blocknote = getMockDocument()
    const doc = BlocknoteConverter.convertDataToYDoc(blocknote)
    const data = BlocknoteConverter.convertYDocToData(doc)
    expect(data).toEqual(blocknote)
  })
  it('Platform convertYDocToData', () => {
    const platform = getMockPlatform()
    const doc = PlatformConverter.convertDataToYDoc(platform)
    const data = PlatformConverter.convertYDocToData(doc)
    expect(data).toEqual(platform)
  })
  it('Sketch convertYDocToData', () => {
    const sketch = getMockSketch()
    const doc = SketchConverter.convertDataToYDoc(sketch)
    const data = SketchConverter.convertYDocToData(doc)
    expect(data).toEqual(sketch)
  })

  it('File convertYDocToData', () => {
    const fileStr = 'any test string'
    const doc = FileConverter.convertDataToYDoc({
      ...SourceTemplates.empty(),
      contents: fileStr,
      extension: 'txt',
    })
    const data = FileConverter.convertYDocToData(doc)
    expect(data.contents).toEqual(fileStr)
  })

  it('VariableGroupConverter convertDataToYDoc and back empty', () => {
    const doc = VariableGroupConverter.convertDataToYDoc()
    const data = VariableGroupConverter.convertYDocToData(doc)
    expect(data).toEqual(VariableGroupTemplates.empty())
    expect(data.groups).toBeDefined()
  })
  it('VariableGroupConverter convertDataToYDoc', () => {
    const initialData = VariableGroupTemplates.empty()
    initialData.groups = {
      testId: {
        id: 'testId',
        name: 'testName',
        groups: {
          nestedId: {
            id: 'nestedId',
            name: 'testName',
            variables: { test: { id: 'nestedVariableId', name: 'test', secret: false, description: '', value: 'test' } },
          },
        },
        variables: { test: { id: 'variableId', name: 'test', secret: false, description: '' } },
      },
    }

    const doc = VariableGroupConverter.convertDataToYDoc(initialData)
    const data = VariableGroupConverter.convertYDocToData(doc)
    expect(data).toEqual(initialData)
  })

  it('Component convertYDocToData', () => {
    const component = PlatformComponentTemplates.empty()
    component.name = ''
    component.description = getMockDescription()
    const doc = PlatformComponentConverter.convertDataToYDoc(component)
    const data = PlatformComponentConverter.convertYDocToData(doc)
    expect(data).toEqual(component)
  })
  it('convertDataToState', () => {
    const blocknote = getMockDocument()
    const state = convertDataToState(
      EntityType.NOTEBOOK,
      blocknote as Blocknote.BlockElement,
    )
    const data = convertStateToData(EntityType.NOTEBOOK, state)
    expect(data).toEqual(blocknote)
  })

  it('getSummaryFromData VariableGroup', () => {
    const initialData = VariableGroupTemplates.empty()
    initialData.groups = {
      '1': {
        name: '1',
        id: '1',
        groups: {
          '1_1': {
            name: '1_1',
            id: '1_1',
            groups: {
              '1_1_1': {
                id: '1_1_1',
                name: '1_1_1',
              },
            },
          },
        },
      },
    }
    const summary = EntityConverter.getSummaryFromData(EntityType.VARIABLE_GROUP, initialData)
    expect(summary.groups).toBe(JSON.stringify(['1', '1_1', '1_1_1']))
  })
})
