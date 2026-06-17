import * as Y from 'yjs'
import { Blocknote } from '@multiplayer/types'

import { BlocknoteSetters } from '../setters'
import { BlocknoteTemplates } from '../templates'
import { DataProcessors, YjsEntityConverter } from './yjs-converter'
import { migrateBlocknoteToV1 } from './migrations/20240221-blocknote-v1'
import { migrateBlocknoteToV2 } from './migrations/20250108-blocknote-v2'
import { importNotebookData } from '../importers'
import { BlocknoteHelper } from '../helpers/blocknote.helper'
import { migrateBlocknoteToV3 } from './migrations/202504023-blocknote-v3'

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { CHUNK_SIZE } from '../config'
import { Document } from '@langchain/core/documents'

class BlocknoteConverter extends YjsEntityConverter<Blocknote.Data> {
  convertSourceToData(name: string, source: string, extension?: string | undefined, processors?: DataProcessors): Blocknote.Data {
    return importNotebookData(source, processors, BlocknoteTemplates.empty(name))
  }

  convertDataToYDoc (data: Blocknote.Data = BlocknoteTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)
    const setter = new BlocknoteSetters(doc)
    setter.setFields(data)
    doc.getXmlFragment('xml').push([BlocknoteHelper.convertJsonToYXml(data)])
    return doc
  }

  convertYDocToData (doc: Y.Doc): Blocknote.Data {
    const entityData = super.convertYDocToData(doc)
    const xml = doc.getXmlFragment('xml')
    const environments = doc.getMap('environments')
    const resp: any = BlocknoteHelper.convertYXmlFragmentToJson(xml)

    return { ...entityData, ...resp as Blocknote.Data, environments: environments.toJSON() }
  }

  applyDocumentMigration(doc: Y.Doc): void {
    doc.transact(() => {
      let version = doc.getMap<any>('version').get('mpVersion') || 0
      if (version === BlocknoteTemplates.CURRENT_VERSION) return

      if (version === 0) {
        const xml = doc.getXmlFragment('xml')
        migrateBlocknoteToV1(xml)
        version++
      }
      if (version === 1) {
        migrateBlocknoteToV2(doc)
        version++
      }
      if (version === 2) {
        migrateBlocknoteToV3(doc)
        version++
      }
      doc.getMap<number>('version').set('mpVersion', version)
    })
  }

  stringify(data: Blocknote.Data) {
    return this.convertBlockToText(data)
  }
  async chunk(data: Blocknote.Data) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: 50,
    })
    const pageContent = this.stringify(data)
    const docOutput = await splitter.splitDocuments([
      new Document({ pageContent }),
    ])
    return docOutput.map((output) => {
      return { chunk: output.pageContent, keywords: [] }
    })
  }

  private convertBlockToText(element: Blocknote.BlockElement): string {
    if (element.attrs?._runnable) {
      return JSON.stringify(element.attrs)
    }
    if (!element.content) {
      return ''
    }
    if (element.content.length &&
      BlocknoteHelper.instanceOfInlineElement(element.content[0])) {
      return (element.content as Blocknote.InlineElement[])?.map((innerElement: Blocknote.InlineElement) =>
        innerElement.text,
      ).join()
    }
    return element.content
      .map((innerElement) => this.convertBlockToText(innerElement))
      .join('\n')
  }

}
export default new BlocknoteConverter()
