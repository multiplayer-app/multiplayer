import * as Y from 'yjs'
import { Doc } from 'yjs'
import { YjsEntityConverter } from './yjs-converter'
import { EntityVisibility, EnvironmentData, EnvironmentInformation } from '@multiplayer/types'
import { EnvironmentTemplates } from '../templates'
import { migrateBlocknoteToV1 } from './migrations/20240221-blocknote-v1'

class EnvironmentConverter extends YjsEntityConverter<EnvironmentData> {
  convertSourceToData(name: string, source: string, extension?: string | undefined): EnvironmentData {
    return EnvironmentTemplates.empty(name)
  }
  convertDataToYDoc (data: EnvironmentData = EnvironmentTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)

    const information = doc.getMap('information')
    information.set('slug', data.information.slug)
    information.set('type', data.information.type)
    return doc
  }
  convertYDocToData(doc: Y.Doc): EnvironmentData {
    const information = doc.getMap('information').toJSON()
    const entityData = super.convertYDocToData(doc)
    return {
      ...entityData,
      information: {
        slug: information.slug || '',
        type: information.type || '',
        shortDescription: information.shortDescription || '',
        visibility: information.visibility || EntityVisibility.PRIVATE,
      },
    }
  }

  getSummaryFromData(data: EnvironmentData = EnvironmentTemplates.empty()) {
    return {
      slug: data.information.slug || '',
      type: data.information.type || '',
      visibility: data.information.visibility || EntityVisibility.PRIVATE,
      shortDescription: data.information.shortDescription || '',
    }
  }
  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === EnvironmentTemplates.CURRENT_VERSION) return

    if (version === 0) {
      migrateBlocknoteToV1(doc.getXmlFragment('description'))
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }
}
export default new EnvironmentConverter()
