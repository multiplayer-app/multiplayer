import {
  BlocknoteTemplates,
  EntityDiffPatch,
  PlatformTemplates, SourceTemplates,
} from '../src'
import { ComponentType, EntityType } from '@multiplayer/types'

function getMockSketch() {
  return {
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
    'records': [
      {
        'x': 25.987575683593775,
        'y': 154.2193896484375,
        'z': 1,
        'id': 'camera:ccJrSDXLxBeI_HGAs5ne2',
        'typeName': 'camera',
      },
    ],
  }
}

describe('Entity diff-patch', () => {
  describe('Blocknote', () => {
    let patcher: EntityDiffPatch.DiffPatcher<object | string>

    beforeAll(()=>{
      patcher = EntityDiffPatch.getDiffPatcher(EntityType.NOTEBOOK)
    })

    it('getDiff', () =>{
      const doc1 = BlocknoteTemplates.empty()
      const doc2 = JSON.parse(JSON.stringify(doc1))

      doc2.content[0].content = [{
        'type': 'text',
        'text': 'updated text',
      }]
      const diff = patcher.getDiff(doc1, doc2)
      expect(diff).toEqual({
        'content': {
          '0': {
            'content': [
              [
                {
                  'text': 'updated text',
                  'type': 'text',
                },
              ],
            ],
          },
          '_t': 'a',
        },
      })
    })
    it('applyDiff', () =>{
      const doc1 = BlocknoteTemplates.empty()
      const doc2 = JSON.parse(JSON.stringify(doc1))
      doc2.content[0].content = [{
        'type': 'text',
        'text': 'updated text',
      }]
      const diff = patcher.getDiff(doc1, doc2)
      const [,updated] = patcher.applyPatch(doc1, diff)
      expect(updated).toEqual(doc2)
    })
    it('hasConflicts true', () => {
      const initial = BlocknoteTemplates.empty()
      const doc1 = JSON.parse(JSON.stringify(initial))
      const doc2 = JSON.parse(JSON.stringify(initial))

      doc1.content[0].content = [{
        'type': 'text',
        'text': 'doc1 text',
      }]
      doc2.content[0].content = [{
        'type': 'text',
        'text': 'doc2 text',
      }]

      const diff1 = patcher.getDiff(initial, doc1)
      const diff2 = patcher.getDiff(initial, doc2)
      const hasConflicts = patcher.hasConflicts(diff1, diff2, initial)
      expect(hasConflicts).toBeTruthy()
    })
    it('hasConflicts false', () => {
      const initial = BlocknoteTemplates.empty()
      const doc1 = JSON.parse(JSON.stringify(initial))
      const doc2 = JSON.parse(JSON.stringify(initial))

      doc1.content[0].attrs = { textAlignment: 'rigth' }
      doc2.content[0].content = [{
        'type': 'text',
        'text': 'doc2 text',
      }]

      const diff1 = patcher.getDiff(initial, doc1)
      const diff2 = patcher.getDiff(initial, doc2)
      const hasConflicts = patcher.hasConflicts(diff1, diff2, initial)
      expect(hasConflicts).toBeFalsy()
    })
  })

  describe('Platform', () => {
    let patcher: EntityDiffPatch.DiffPatcher<object | string>

    beforeAll(()=>{
      patcher = EntityDiffPatch.getDiffPatcher(EntityType.PLATFORM)
    })
    it('getDiff', () =>{
      const p1 = PlatformTemplates.empty()
      const p2 = PlatformTemplates.empty()
      p2.components['newId'] = { id: 'newId', name: 'test', type: ComponentType.GENERIC }
      const diff = patcher.getDiff(p1, p2)
      expect(diff).toEqual({ components: { newId: [p2.components['newId']] } })
    })
    it('applyDiff', () => {
      const p1 = PlatformTemplates.empty()
      const p2 = PlatformTemplates.empty()
      p2.components['newId'] = { id: 'newId', name: 'test', type: ComponentType.GENERIC }
      const diff = patcher.getDiff(p1, p2)
      const [,updated] = patcher.applyPatch(p1, diff)
      expect(updated).toEqual(p2)
    })
    it('hasConflicts true', () =>{
      const initial = PlatformTemplates.empty()
      initial.components['id'] = { id: 'id', name: 'test', type: ComponentType.GENERIC }

      const p2 = JSON.parse(JSON.stringify(initial))
      p2.components['id'].name = 'name p2'

      const p3 = JSON.parse(JSON.stringify(initial))
      p3.components['id'].name = 'name p3'

      const diff1 = patcher.getDiff(initial, p2)
      const diff2 = patcher.getDiff(initial, p3)
      const hasConflicts = patcher.hasConflicts(diff1, diff2, initial)
      expect(hasConflicts).toBeTruthy()
    })

    it('hasConflicts false', () =>{
      const initial = PlatformTemplates.empty()
      initial.components['id'] = { id: 'id', name: 'test', type: ComponentType.GENERIC }

      const p2 = JSON.parse(JSON.stringify(initial))
      p2.components['id'].type = ComponentType.PLATFORM

      const p3 = JSON.parse(JSON.stringify(initial))
      p3.components['id'].name = 'name p3'

      const diff1 = patcher.getDiff(initial, p2)
      const diff2 = patcher.getDiff(initial, p3)
      const hasConflicts = patcher.hasConflicts(diff1, diff2, initial)
      expect(hasConflicts).toBeFalsy()
    })
  })

  describe('File', () => {
    let patcher: EntityDiffPatch.DiffPatcher<object | string>

    beforeAll(()=>{
      patcher = EntityDiffPatch.getDiffPatcher(EntityType.FILE)
    })
    it('getDiff', () =>{
      const file1 = SourceTemplates.empty('test', { contents: 'cats bark' })
      const file2 = SourceTemplates.empty('test', { contents: 'dogs bark' })
      const diff = patcher.getDiff(file1, file2)
      expect(diff).toEqual([
        {
          'diffs': [
            [
              -1,
              'cat',
            ],
            [
              1,
              'dog',
            ],
            [
              0,
              's ba',
            ],
          ],
          'start1': 0,
          'start2': 0,
          'length1': 7,
          'length2': 7,
        },
      ])
    })
    it('applyDiff', () =>{
      const file1 = SourceTemplates.empty('test', { contents: 'cats bark' })
      const file2 = SourceTemplates.empty('test', { contents: 'dogs bark' })
      const diff = patcher.getDiff(file1, file2)
      const [isApplied,updated] = patcher.applyPatch(file1, diff)
      expect(isApplied).toBeTruthy()
      expect(updated).toEqual(file2)
    })
    it('hasConflicts false', () =>{
      const initial = SourceTemplates.empty('test', { contents: 'cats bark' })
      const file2 = SourceTemplates.empty('test', { contents: 'cats meow' })
      const file3 = SourceTemplates.empty('test', { contents: 'dogs bark' })

      const diff1 = patcher.getDiff(initial, file2)
      const diff2 = patcher.getDiff(initial, file3)
      const hasConflicts = patcher.hasConflicts(diff1, diff2, initial)
      expect(hasConflicts).toBeFalsy()
    })
  })

  describe('Sketch', () => {
    let patcher: EntityDiffPatch.DiffPatcher<object | string>

    beforeAll(()=>{
      patcher = EntityDiffPatch.getDiffPatcher(EntityType.SKETCH)
    })
    it('getDiff', () =>{
      const sketch1 = getMockSketch()
      const sketch2 = getMockSketch()
      sketch2.records[0].x = 1
      const diff = patcher.getDiff(sketch1, sketch2)
      expect(diff).toEqual({ records: { _t: 'a', 0: { x: [sketch1.records[0].x, 1] } } })
    })

    it('applyDiff', () =>{
      const sketch1 = getMockSketch()
      const sketch2 = getMockSketch()
      sketch2.records[0].x = 1
      const diff = patcher.getDiff(sketch1, sketch2)
      const [,updated] = patcher.applyPatch(sketch1, diff)
      expect(updated).toEqual(sketch2)
    })
    it('hasConflicts true', () =>{
      const initial = getMockSketch()
      const sketch2 = getMockSketch()
      sketch2.records[0].x = 1
      const sketch3 = getMockSketch()
      sketch3.records[0].x = 3

      const diff1 = patcher.getDiff(initial, sketch2)
      const diff2 = patcher.getDiff(initial, sketch3)
      const hasConflicts = patcher.hasConflicts(diff1, diff2, initial)
      expect(hasConflicts).toBeTruthy()
    })
    it('hasConflicts false', () =>{
      const initial = getMockSketch()
      const sketch2 = getMockSketch()
      sketch2.records[0].x = 1
      const sketch3 = getMockSketch()
      sketch3.records[0].y = 3

      const diff1 = patcher.getDiff(initial, sketch2)
      const diff2 = patcher.getDiff(initial, sketch3)
      const hasConflicts = patcher.hasConflicts(diff1, diff2, initial)
      expect(hasConflicts).toBe(false)
    })
  })
})
