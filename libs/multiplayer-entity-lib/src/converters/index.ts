import BlocknoteConverter from './blocknote.converter'
import SketchConverter from './sketch.converter'
import FileConverter from './file.converter'
import PlatformConverter from './platform.converter'
import { EntityType, NotesType, RequestEntityType } from '@multiplayer/types'
import * as Y from 'yjs'
import PlatformComponentConverter from './platform-component.converter'
import MergeRequestConverter from './merge-request.converter'
import { DataProcessors, YjsConverter, YjsEntityConverter } from './yjs-converter'
import ApiConverter from './api.converter'
import {
  BlocknoteTemplates,
  EnvironmentTemplates,
  PlatformComponentTemplates,
  PlatformTemplates,
  SketchTemplates,
  SourceTemplates,
  ApiTemplates,
  ExcalidrawTemplates, VariableGroupTemplates, SessionNotesTemplates,
} from '../templates'
import EnvironmentConverter from './environment.converter'
import ExcalidrawConverter from './excalidraw.converter'
import VariableGroupConverter from './variable-group.converter'
import SessionNotesConverter from './session-notes.converter'

const initialContent: Record<EntityType & RequestEntityType, (name, summary) => any> = {
  [EntityType.FILE]: SourceTemplates.empty,
  [EntityType.SKETCH]: SketchTemplates.empty,
  [EntityType.EXCALIDRAW]: ExcalidrawTemplates.empty,
  [EntityType.PLATFORM]: PlatformTemplates.empty,
  [EntityType.NOTEBOOK]: BlocknoteTemplates.empty,
  [EntityType.PLATFORM_COMPONENT]: PlatformComponentTemplates.empty,
  [EntityType.API]: ApiTemplates.empty,
  [EntityType.ENVIRONMENT]: EnvironmentTemplates.empty,
  [EntityType.VARIABLE_GROUP]: VariableGroupTemplates.empty,
  [RequestEntityType.MERGE_REQUEST]: () => ({}),
  [NotesType.SESSION]: () => SessionNotesTemplates.empty(),
}

type ConvertableEntityType = EntityType | RequestEntityType | NotesType

const converters: Record<EntityType & RequestEntityType, YjsConverter<any>> = {
  [EntityType.FILE]: FileConverter,
  [EntityType.SKETCH]: SketchConverter,
  [EntityType.EXCALIDRAW]: ExcalidrawConverter,
  [EntityType.PLATFORM]: PlatformConverter,
  [EntityType.NOTEBOOK]: BlocknoteConverter,
  [EntityType.PLATFORM_COMPONENT]: PlatformComponentConverter,
  [EntityType.API]: ApiConverter,
  [EntityType.ENVIRONMENT]: EnvironmentConverter,
  [EntityType.VARIABLE_GROUP]: VariableGroupConverter,
  [RequestEntityType.MERGE_REQUEST]: MergeRequestConverter,
  [NotesType.SESSION]: SessionNotesConverter,
}

export function convertDataToYDoc(entityType: ConvertableEntityType, data?: any) {
  if (converters[entityType]) {
    return converters[entityType].convertDataToYDoc(data)
  }

  return new Y.Doc()
}

export function convertDataToState(entityType: ConvertableEntityType, data?: any) {
  return Y.encodeStateAsUpdate(convertDataToYDoc(entityType, data))
}

export function convertYDocToData(
  entityType: ConvertableEntityType,
  doc: Y.Doc,
): any {
  if (converters[entityType]) {
    return converters[entityType].convertYDocToData(doc)
  }

  return undefined
}

export function convertStateToData(
  entityType: ConvertableEntityType,
  state: Uint8Array,
): any {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, state)

  return convertYDocToData(entityType, doc)
}

export function getEmptyTemplateData(
  entityType: ConvertableEntityType,
  name: string,
  summaryToOverride?: Record<string, string>,
) {
  return initialContent[entityType](name, summaryToOverride)
}

export function getInitialContent(entityType: ConvertableEntityType, summaryToOverride?: Record<string, string>, name = '') {
  return Y.encodeStateAsUpdate(convertDataToYDoc(
    entityType,
    getEmptyTemplateData(entityType, name, summaryToOverride)),
  )
}

export function getSummaryFromState(
  entityType: ConvertableEntityType,
  state: Uint8Array,
): Record<string, any> {
  const data = convertStateToData(entityType, state)

  if (converters[entityType]) {
    return converters[entityType].getSummaryFromData?.(data) || {}
  } else {
    return {}
  }
}

export function getSummaryFromData(
  entityType: ConvertableEntityType,
  data?: any,
): Record<string, any> {
  return converters[entityType] ? converters[entityType].getSummaryFromData?.(data) || {} : {}
}

export function convertSourceToData(
  entityType: ConvertableEntityType,
  name: string,
  source: string,
  extension: string = 'txt',
  processors?: DataProcessors): any {
  return converters[entityType]?.convertSourceToData(name, source, extension, processors)
}

export function convertSourceToState(
  entityType: ConvertableEntityType,
  name: string,
  source: string,
  extension: string = 'txt',
  processors?: DataProcessors): Uint8Array {
  return Y.encodeStateAsUpdate(convertDataToYDoc(
    entityType,
    converters[entityType]?.convertSourceToData(name, source, extension, processors)),
  )
}

export function applyDocumentMigration(entityType: ConvertableEntityType, doc: Y.Doc) {
  if (converters[entityType]) {
    converters[entityType].applyDocumentMigration(doc)
  }
}

export function applyStateMigration(entityType: ConvertableEntityType, state: Uint8Array) {
  if (converters[entityType]) {
    const doc = new Y.Doc()
    Y.applyUpdate(doc, state)
    converters[entityType].applyDocumentMigration(doc)
    return Y.encodeStateAsUpdate(doc)
  }
  return state
}

export function stringifyData(entityType: ConvertableEntityType, data: any, processors?: DataProcessors): string {
  if (!data || !converters[entityType]) return ''
  return converters[entityType].stringify(data, processors) || ''
}

export function convertDataToChunks(entityType: ConvertableEntityType, data: any): Promise<{ chunk: string, keywords: string[] }[]> {
  if (!converters[entityType] || !(converters[entityType] instanceof YjsEntityConverter)) {
    return Promise.resolve([])
  }
  return converters[entityType].chunk(data)
}
