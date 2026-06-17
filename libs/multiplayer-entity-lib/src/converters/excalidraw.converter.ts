import * as Y from 'yjs'
import { YjsEntityConverter } from './yjs-converter'
import { ExcalidrawTemplates } from '../templates'
import { Doc } from 'yjs'
import { ExcalidrawData } from '@multiplayer/types'

class ExcalidrawConverter extends YjsEntityConverter<ExcalidrawData> {
  convertSourceToData(name: string, source: string, extension?: string | undefined): ExcalidrawData {
    return ExcalidrawTemplates.empty(name)
  }

  convertDataToYDoc (data: ExcalidrawData = ExcalidrawTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)
    const elements = doc.getMap('elements')
    const files = doc.getMap('files')
    data.elements.forEach((element) => {
      elements.set(element.id, element)
    })
    Object.keys(data.files).forEach((key) => {
      files.set(key, data.files[key])
    })
    return doc
  }
  convertYDocToData(doc: Y.Doc): ExcalidrawData {
    const entityData = super.convertYDocToData(doc)
    return {
      ...entityData,
      elements: Array.from(doc.getMap<{ order: number }>('elements').values()).sort((a, b) => a.order - b.order),
      files: doc.getMap('files').toJSON(),
    }
  }

  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === ExcalidrawTemplates.CURRENT_VERSION) return

    if (version === 0) {
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }
}
export default new ExcalidrawConverter()
