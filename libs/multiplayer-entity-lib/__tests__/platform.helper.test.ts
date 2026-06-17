import * as Y from 'yjs'
import {
  addComponentToPlatform,
  addEdgeToPlatform,
  getComponentUuid,
  isEdgeExistsInPlatform,
  isComponentAddedToPlatform,
} from '../src/helpers/platform.helper'
import PlatformConverter from '../src/converters/platform.converter'
import { PlatformTemplates } from '../src'
import { v4 as uuidv4 } from 'uuid'

describe('Platform helper', () => {
  let doc: Y.Doc
  const testComp1Id = uuidv4()
  const testComp2Id = uuidv4()

  const linkedToComp1 = 'entity1'
  const linkedToComp2 = 'entity2'

  const edgeId = 'testEdge'

  beforeEach(() => {
    doc = PlatformConverter.convertDataToYDoc({
      ...PlatformTemplates.empty(),
      components: {
        [testComp1Id]: {
          id: testComp1Id,
          linkedTo: linkedToComp1,
        },
        [testComp2Id]: {
          id: testComp2Id,
          linkedTo: linkedToComp2,
        },
      },
      edges: {
        [edgeId]: {
          id: edgeId,
          source: testComp1Id,
          target: testComp2Id,
        },
      },
    })
  })
  it('getComponentUuid get existing', () => {
    const found = getComponentUuid(doc, linkedToComp1)
    expect(found).toBeDefined()
    expect(found).toEqual(testComp1Id)
  })
  it('getComponentUuid get non existing', () => {
    const found = getComponentUuid(doc, 'unknownId')
    expect(found).toBeUndefined()
  })

  it('isComponentAddedToPlatform found', () => {
    const found = isComponentAddedToPlatform(doc, linkedToComp1)
    expect(found).toBe(true)
  })

  it('isComponentAddedToPlatform not found', () => {
    const found = isComponentAddedToPlatform(doc, 'unknown')
    expect(found).toBe(false)
  })

  it('addComponentToPlatform', () => {
    const newEntityId = 'newEntityId'
    const platform = addComponentToPlatform(doc, newEntityId)
      .getMap('object')
      .toJSON()

    expect(Object.keys(platform.components).length).toBe(3)
    expect(Object.values(platform.components)[2]).toHaveProperty('linkedTo', newEntityId)
  })

  it('isEdgeExistsInPlatform exists', () => {
    const found = isEdgeExistsInPlatform(doc, linkedToComp1, linkedToComp2)
    expect(found).toBe(true)
  })
  it('isEdgeExistsInPlatform does not exist', () => {
    const found = isEdgeExistsInPlatform(doc, linkedToComp2, linkedToComp1)
    expect(found).toBe(false)
  })

  it('addEdgeToPlatform', () => {
    const platform = addEdgeToPlatform(doc, linkedToComp2, linkedToComp1)
      .getMap('object')
      .toJSON()

    expect(Object.keys(platform.edges).length).toBe(2)
    expect(Object.values(platform.edges)[1]).toHaveProperty('source', testComp2Id)
    expect(Object.values(platform.edges)[1]).toHaveProperty('target', testComp1Id)
  })
})
