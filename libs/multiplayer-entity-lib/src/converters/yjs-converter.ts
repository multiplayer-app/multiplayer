import * as Y from 'yjs'
import { Blocknote, EntityData, EntityInformation } from '@multiplayer/types'
import { EntityDataTemplate } from '../templates/entity-data.template'
import { BlocknoteTemplates } from '../templates'
import { EntityDataSetters } from '../setters'
import { BlocknoteHelper } from '../helpers/blocknote.helper'
import { docTemplate } from '../templates/blocknote.template'

export interface YjsConverter<T> {
  convertDataToYDoc: (data: T) => Y.Doc
  convertYDocToData: (doc: Y.Doc) => T | undefined
  getSummaryFromData?: (data: T) => Record<string, any>
  convertSourceToData?: (name: string, source: string, extension?: string) => T
  applyDocumentMigration?: (doc: Y.Doc) => void
}

export interface DataProcessors {
  convertStringToHtmlBody?: (data: string) => HTMLElement
  getImageUrl?: (src: string, description?: string, title?: string) => string | undefined
  processBlockContent?: (content: string, blockId?: string) => string
}

export abstract class YjsEntityConverter<T extends EntityData> {
  convertDataToYDoc (data: T): Y.Doc {
    const doc = new Y.Doc()
    const setters = new EntityDataSetters(doc)
    setters.setFields(data)
    return doc
  }
  convertYDocToData(doc: Y.Doc): EntityData {
    const xml = doc.getXmlFragment('description')
    let description: Blocknote.BlockElement = BlocknoteTemplates.docTemplate()
    if (xml.firstChild !== null && !(xml.firstChild instanceof Y.XmlText)) {
      description = BlocknoteHelper.convertYXmlFragmentToJson(xml)
    }
    const information = doc.getMap('information').toJSON()

    return {
      mpVersion: doc.getMap('version').get('mpVersion') as number,
      name: doc.getMap('name').get('name') as string,
      information: {
        visibility: information.visibility||'',
        shortDescription: information.shortDescription || '',
      },
      description,
    }
  }

  getSummaryFromData(data: EntityData = EntityDataTemplate.empty()): EntityInformation & Record<string, string | undefined> {
    const information = data?.information
    return {
      visibility: information?.visibility || '',
      shortDescription: (information?.shortDescription || '').slice(0, 125),
    }
  }
  stringify(data: T, processors?: DataProcessors): string {
    return ''
  }
  async chunk(data: T): Promise<{ chunk: string, keywords: string[] }[]> {
    return Promise.resolve([])
  }

  abstract applyDocumentMigration(doc: Y.Doc): void
  abstract convertSourceToData(name: string, source: string, extension?: string, processors?: DataProcessors): T
}
