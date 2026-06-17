import { YjsEntityConverter } from './yjs-converter'
import * as Y from 'yjs'
import {
  Blocknote,
  ComponentType,
  PlatformComponent,
  PlatformComponentInformation,
} from '@multiplayer/types'
import { PlatformComponentInformationSetters } from '../setters'
import { BlocknoteTemplates, PlatformComponentTemplates } from '../templates'
import BlocknoteConverter from './blocknote.converter'
import { Doc } from 'yjs'
import { migrateBlocknoteToV1 } from './migrations/20240221-blocknote-v1'
import { BlocknoteHelper } from '../helpers/blocknote.helper'

class PlatformComponentConverter extends YjsEntityConverter<PlatformComponent> {
  convertSourceToData(name: string, source: string, extension?: string): PlatformComponent {
    return PlatformComponentTemplates.empty(name)
  }
  convertDataToYDoc(data: PlatformComponent = PlatformComponentTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)
    const information = doc.getMap('information')
    const setters = new PlatformComponentInformationSetters(information)
    setters.setFields(data.information)

    const vars = doc.getMap('environmentVariables')
    Object.keys(data.environmentVariables).forEach((variable) => {
      vars.set(variable, data.environmentVariables[variable])
    })

    return doc
  }

  convertYDocToData(doc: Y.Doc): PlatformComponent {
    const information = doc.getMap('information').toJSON()
    const environmentVariables = doc.getMap('environmentVariables').toJSON()
    const entityData = super.convertYDocToData(doc)
    return {
      ...entityData,
      information: {
        type: information.type|| ComponentType.GENERIC,
        visibility: information.visibility||'',
        owner: information.owner ||'',
        slug: information.slug || '',
        shortDescription: information.shortDescription || '',
        color: information.color || '',
        iconUrl: information.iconUrl || '',
      },
      environmentVariables,
    }
  }
  getSummaryFromData(data: PlatformComponent = PlatformComponentTemplates.empty()) {
    const information = data?.information
    return {
      ...super.getSummaryFromData(data),
      type: information?.type || ComponentType.GENERIC,
      owner: information?.owner || '',
      slug: (information?.slug || '').slice(0, 125),
      color: information?.color,
      iconUrl: information?.iconUrl,
    }
  }
  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === PlatformComponentTemplates.CURRENT_VERSION) return

    if (version === 0) {
      migrateBlocknoteToV1(doc.getXmlFragment('description'))
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }
}

export default new PlatformComponentConverter()
