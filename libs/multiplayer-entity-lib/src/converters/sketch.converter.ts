import * as Y from 'yjs'
import { YjsEntityConverter } from './yjs-converter'
import { SketchTemplates } from '../templates'
import { SketchData } from '@multiplayer/types'
import { Doc } from 'yjs'


class SketchConverter extends YjsEntityConverter<SketchData> {
  convertSourceToData(name: string, source: string, extension?: string): SketchData {
    return SketchTemplates.empty(name)
  }
  convertDataToYDoc(data: SketchData = SketchTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)

    const schema = doc.getMap('schema')
    const records = doc.getMap('records')
    const version = doc.getMap('version')

    version.set('tldrawFileFormatVersion', data.tldrawFileFormatVersion)

    Object.keys(data.schema).forEach((key) => {
      schema.set(key, data.schema[key])
    })

    data.records.forEach((record) => {
      records.set(record.id, record)
    })
    return doc
  }

  convertYDocToData(doc: Y.Doc): SketchData {
    const entityData = super.convertYDocToData(doc)
    const schema = doc.getMap('schema').toJSON()
    const records = Object.values(doc.getMap('records').toJSON())
    const versions: Y.Map<number> = doc.getMap('version')
    const tldrawFileFormatVersion = versions.get('tldrawFileFormatVersion') || 0
    return {
      ...entityData,
      schema, records, tldrawFileFormatVersion,
    }
  }

  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === SketchTemplates.CURRENT_VERSION) return

    if (version === 0) {
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }
}
export default new SketchConverter()
