import * as Y from 'yjs'
import { YjsEntityConverter } from './yjs-converter'
import { ApiData, ApiType, EntityInformation } from '@multiplayer/types'
import YAML from 'js-yaml'
import { ApiTemplates } from '../templates'
import { Doc } from 'yjs'
import { ApiHelper } from '../helpers'
import { CHUNK_SIZE } from '../config'
import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

class ApiConverter extends YjsEntityConverter<ApiData> {
  convertSourceToData(name: string, source: string, extension?: string | undefined): ApiData {
    return ApiTemplates.empty(name, { contents: source, extension })
  }
  convertDataToYDoc (data: ApiData = ApiTemplates.empty()): Y.Doc {
    const doc = super.convertDataToYDoc(data)

    const updatedContents = this.getPrettifiedContents(data.contents, data.extension)
    doc.getText('text').insert(0, updatedContents)

    const parsedObject = ApiHelper.getParsedJson(updatedContents, data.extension)
    const metadata = ApiHelper.fetchMetadata(data.extension, updatedContents, parsedObject)

    const metadataMap = doc.getMap('metadata')
    metadataMap.set('extension', data.extension)
    metadataMap.set('provider', metadata.provider)
    metadataMap.set('version', metadata.version)

    if (metadata.provider === ApiType.OPENAPI) {
      const object = doc.getMap('object')
      object.set('paths', new Y.Map<unknown>())
      object.set('tags', new Y.Map<unknown>())
      object.set('components', new Y.Map<unknown>())

      const views = doc.getMap('views')
      if (data.views) {
        Object.values(data.views).forEach((apiView) => {
          views.set(apiView.id, apiView)
        })
      }

      if (
        parsedObject
        && ApiHelper.isConvertibleApi(metadata.provider)
        && ApiHelper.isValidApi(ApiType[metadata.provider], metadata.version, parsedObject)
      ) {
        const setterConstructor = ApiHelper.getOpenapiSetters(metadata.version)
        if (setterConstructor) {
          const setters = new setterConstructor(doc)
          setters.setFields(parsedObject as any)
        }
      }
    }
    return doc
  }
  convertYDocToData(doc: Y.Doc): ApiData & { object: any, views: Record<string, any> } {
    const metadataMap: Y.Map<string> = doc.getMap('metadata')
    const entityData = super.convertYDocToData(doc)
    return {
      ...entityData,
      object: doc.getMap('object').toJSON(),
      contents: doc.getText('text').toJSON(),
      extension: metadataMap.get('extension') || 'json',
      views: doc.getMap('views').toJSON(),
      metadata: {
        version: metadataMap.get('version') || undefined,
        provider: metadataMap.get('provider') as ApiType || undefined,
      },
    }
  }

  getSummaryFromData(data: ApiData = ApiTemplates.empty()) {
    return {
      ...super.getSummaryFromData(data),
      version: data.metadata?.version,
      provider: data.metadata?.provider,
      extension: data.extension,
    }
  }

  private getPrettifiedContents(contents: string, extension: string) {
    try {
      if (extension === 'json') {
        const parsed = JSON.parse(contents)
        return JSON.stringify(parsed, null, 2)
      }
      if (extension === 'yaml' || extension === 'yml') {
        const parsed = YAML.load(contents) as Record<string, unknown>
        return YAML.dump(parsed)
      }
      return contents
    } catch (err) {
      return contents
    }
  }
  applyDocumentMigration(doc: Doc): void {
    let version = doc.getMap<number>('version').get('mpVersion') || 0
    if (version === ApiTemplates.CURRENT_VERSION) return

    if (version === 0) {
      version++
    }

    doc.getMap<number>('version').set('mpVersion', version)
  }

  stringify(data: ApiData) {
    const contents = data.contents
    try {
      if (data.extension === 'json') {
        const parsed = JSON.parse(contents)
        return YAML.dump(parsed)
      }
      if (data.extension === 'yaml' || data.extension === 'yml') {
        return contents
      }
      return contents
    } catch (err) {
      return contents
    }
  }

  async chunk(data: ApiData & { object?: any }) {
    const doc = this.convertDataToYDoc(data)
    const object = doc.getMap('object').toJSON()
    if (object) {
      return Object.keys(object).reduce((acc, key) => {
        acc.push(...Object.keys(object[key]).map((internalKey) => {
          const split = internalKey.split(':')
          const keywords = [key, internalKey]
          if (split.length < 1) {
            keywords.push(split[split.length - 1])
          }
          return {
            chunk: JSON.stringify({
              [internalKey]: object[key][internalKey],
            }),
            keywords,
          }
        }))
        return acc
      }, [] as { chunk: string, keywords: string[] }[])
    }
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: 50,
    })
    const docOutput = await splitter.splitDocuments([
      new Document({ pageContent: this.stringify(data) }),
    ])
    return docOutput.map((output) => {
      return { chunk: output.pageContent, keywords: [] }
    })
  }
}
export default new ApiConverter()
