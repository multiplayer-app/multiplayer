import { EntityType } from '@multiplayer/types'
import * as Y from 'yjs'
import { convertDataToYDoc, convertStateToData, convertYDocToData } from '../converters'
import { DiffPatcher } from './diff-patcher'
import DiffMatchPatch from 'diff-match-patch'
import { ObjectDiffPatcher } from './object-diff-patcher'
import { SourceEntityDiffPatcher } from './file-entity-diff-patcher'

export function getDiffPatcher(entityType: EntityType): DiffPatcher<string | object> {
  const customPatchers: Record<string, any> = {
    [EntityType.FILE]: new SourceEntityDiffPatcher(),
    // [EntityType.API]: new TextDiffPatcher(),
    [EntityType.PLATFORM]: new ObjectDiffPatcher({ minLength: 100 }),
    [EntityType.PLATFORM_COMPONENT]: new ObjectDiffPatcher({ minLength: 100 }),
    [EntityType.ENVIRONMENT]: new ObjectDiffPatcher({ minLength: 100 }),
    [EntityType.VARIABLE_GROUP]: new ObjectDiffPatcher({ minLength: 100 }),
  }
  return customPatchers[entityType] ? customPatchers[entityType] : new ObjectDiffPatcher()
}

export function applyPatchToTheYDoc(entityType: EntityType, doc: Y.Doc, patch: any) {
  const patcher = getDiffPatcher(entityType)
  const entity = convertYDocToData(entityType, doc)
  const [,updatedEntity] = patcher.applyPatch(entity, patch)
  const newDoc = convertDataToYDoc(entityType, updatedEntity)
  Y.applyUpdate(doc, Y.encodeStateAsUpdate(newDoc))
}

export function applyPatchToTheYState(entityType: EntityType, state: Uint8Array, patch: any): Uint8Array {
  const patcher = getDiffPatcher(entityType)
  const entity = convertStateToData(entityType, state)
  const [,updatedEntity] = patcher.applyPatch(entity, patch)
  const newDoc = convertDataToYDoc(entityType, updatedEntity)
  return Y.encodeStateAsUpdate(newDoc)
}

export function getDiffBetweenData(data1: any, data2: any, entityType: EntityType): any {
  const patcher = getDiffPatcher(entityType)
  return patcher.getDiff(data1, data2)
}

export function getDiffBetweenStates(state1: Uint8Array, state2: Uint8Array, entityType: EntityType): any {
  const patcher = getDiffPatcher(entityType)
  const entity1 = convertStateToData(entityType, state1)
  const entity2 = convertStateToData(entityType, state2)
  return getDiffBetweenData(entity1, entity2, entityType)
}

export function getDiffBetweenDocs(doc1: Y.Doc, doc2: Y.Doc, entityType: EntityType): any {
  const patcher = getDiffPatcher(entityType)
  const entity1 = convertYDocToData(entityType, doc1)
  const entity2 = convertYDocToData(entityType, doc2)
  return getDiffBetweenData(entity1, entity2, entityType)
}

export function convertTextToPatch(text: string) {
  const patcher = new DiffMatchPatch()
  return patcher.patch_fromText(text)
}

export function getConflictPaths(patch1: any, patch2: any) {
  const objectDiffPatcher = new ObjectDiffPatcher()
  return objectDiffPatcher.getConflictPaths(patch1, patch2)
}
