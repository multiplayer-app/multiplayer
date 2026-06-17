import * as Y from 'yjs'
import { YjsEntityConverter } from './yjs-converter'
import { VariableGroupTemplates } from '../templates'
import {
  VariableGroup,
  VariableGroupData,
} from '@multiplayer/types'
import { Doc } from 'yjs'
import { importVariableGroup } from '../importers'
import { VariableGroupSetters } from '../setters/variable-group/variable-group.setter'


class VariableGroupConverter extends YjsEntityConverter<VariableGroupData> {
  convertSourceToData(name: string, source: string, extension?: string): VariableGroupData {
    return importVariableGroup(source)
  }
  convertDataToYDoc(data: VariableGroupData = VariableGroupTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)
    const setter = new VariableGroupSetters(doc.getMap('object'))
    setter.setFields(data)
    return doc
  }

  convertYDocToData(doc: Y.Doc): VariableGroupData {
    const entityData = super.convertYDocToData(doc)
    const setter = new VariableGroupSetters(doc.getMap('object'))
    const data = setter.getData()
    return {
      ...entityData,
      ...data,
    }
  }
  getSummaryFromData(data: VariableGroupData = VariableGroupTemplates.empty()) {
    return {
      ...super.getSummaryFromData(data),
      groups: JSON.stringify(this.extractKeys(data, 5)),
    }
  }

  private extractKeys(obj: VariableGroupData, maxDepth = 5) {
    const keys: string[] = []

    function recurse(current: VariableGroup, depth: number) {
      if (!current?.groups || depth > maxDepth) return

      for (const key in current.groups) {
        keys.push(key)
        if (current.groups[key]) {
          recurse(current.groups[key], depth + 1)
        }
      }
    }

    if (obj.groups) {
      recurse(obj, 1)
    }

    return keys
  }

  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === VariableGroupTemplates.CURRENT_VERSION) return

    if (version === 0) {
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }
}
export default new VariableGroupConverter()
