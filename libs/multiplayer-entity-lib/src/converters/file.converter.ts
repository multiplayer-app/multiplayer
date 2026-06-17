import * as Y from 'yjs'
import { YjsEntityConverter } from './yjs-converter'
import { SourceData } from '@multiplayer/types'
import { SourceTemplates } from '../templates'
import { Doc } from 'yjs'

class FileConverter extends YjsEntityConverter<SourceData> {
  convertDataToYDoc (data: SourceData = SourceTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)

    const text = doc.getText('text')
    const extension = doc.getMap('metadata')
    extension.set('extension', data.extension)
    text.insert(0, data.contents)
    return doc
  }
  convertYDocToData(doc: Y.Doc): SourceData {
    const entityData = super.convertYDocToData(doc)
    return {
      ...entityData,
      extension: doc.getMap('metadata').get('extension')?.toString() || 'txt',
      contents: doc.getText('text').toJSON(),
    }
  }

  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === SourceTemplates.CURRENT_VERSION) return

    if (version === 0) {
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }

  convertSourceToData(name: string, source: string, extension?: string): SourceData {
    return SourceTemplates.empty(name, { contents: source, extension })
  }
}
export default new FileConverter()
