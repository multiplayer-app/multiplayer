import {
  Auth,
  AuthAttribute,
  Collection,
  Description,
  EnvironmentVariable,
  Item,
  ItemGroup,
  RequestObject,
} from './types'
import { Blocknote, Notebook, VariableGroupData } from '@multiplayer/types'
import { BlocknoteTemplates } from '../../templates'
import { MarkdownParser } from '../markdown'
import { generateJSON } from '@tiptap/html'
import { StarterKit } from '@tiptap/starter-kit'
import { DataProcessors } from '../../converters/yjs-converter'

export class PostmanImporter {
  mdParser: MarkdownParser

  constructor(stringToHtmlConverter?: DataProcessors['convertStringToHtmlBody']) {
    this.mdParser = new MarkdownParser({}, stringToHtmlConverter)
  }
  private buildUrl(urlData: RequestObject['url']) {
    if (typeof urlData === 'string') return urlData

    let url = urlData.raw || ''
    urlData.variable?.forEach(({ key }) => {
      const varRegex = new RegExp(`:${key}`, 'g')
      url = url.replace(varRegex, `{{${key}}}`)
    })
    return url
  }

  private buildParameters(urlData: RequestObject['url'], defaultValue: Notebook.ApiBlockParameters) {
    if (typeof urlData === 'string') return defaultValue
    if (!urlData.query) return []
    return urlData.query.map(({ key, value, description }) => ({
      key: key || '', value: value || '', description: this.buildDescription(description),
    }))
  }

  private convertAuthAttrs(attrs: AuthAttribute[] | undefined) : Record<string, any> {
    return (attrs || [])
      .map(({ key, value }) => ({ [key]: value }))
      .reduce((acc, item) => Object.assign(acc, item), {})
  }

  private buildAuth(auth: RequestObject['auth'], defaultValue: Notebook.Authorization) {
    if (!auth) return { ...defaultValue, type: Notebook.AuthorizationType.NONE }

    switch (auth.type) {
      case 'apikey':
        return {
          ...defaultValue,
          type: Notebook.AuthorizationType.API_KEY,
          [Notebook.AuthorizationType.API_KEY]: {
            key: '', value: '', addTo: Notebook.AuthorizationAddTo.HEADER,
            ...this.convertAuthAttrs(auth.apikey),
          },
        }
      case 'bearer':
        return {
          ...defaultValue,
          type: Notebook.AuthorizationType.BEARER_TOKEN,
          [Notebook.AuthorizationType.BEARER_TOKEN]: {
            token: '',
            ...this.convertAuthAttrs(auth.bearer),
          },
        }
      case 'basic':
        return {
          ...defaultValue,
          type: Notebook.AuthorizationType.BASIC,
          [Notebook.AuthorizationType.BASIC]: {
            username: '', password: '',
            ...this.convertAuthAttrs(auth.basic),
          },
        }
      case 'noauth':
      default:
        return { ...defaultValue, type: Notebook.AuthorizationType.NONE } // other types are not supported yet
    }
  }

  private buildVariables(urlData: RequestObject['url'], defaultValue: Notebook.ApiBlockVariables) {
    if (typeof urlData === 'string' || !urlData.variable) return defaultValue

    return urlData.variable.map(({ key, value, description }) => ({
      key: key || '', value: value || '', description: this.buildDescription(description),
    }))
  }

  private buildName(name: string | undefined) {
    return name?.replace(/[.-]/g, '').replace(/ /g, '_').toLowerCase() || ''
  }

  private buildDescription(descr: Description | undefined): string {
    if (!descr) {
      return ''
    }
    if (typeof descr === 'string') {
      return descr
    }
    return descr.content
  }

  private buildBody(body: RequestObject['body'], defaultValue: Notebook.ApiBlockBody): Notebook.RestApiBlockAttributes['body'] {
    if (!body || body.disabled) return { ...defaultValue, type: Notebook.BodyType.NONE }
    if (body.mode === 'urlencoded') {
      return {
        ...defaultValue,
        type: Notebook.BodyType.URL_ENCODED,
        [Notebook.BodyType.URL_ENCODED]: (body.urlencoded || []).map((data) => ({
          key: data.key,
          value: data.value || '',
          description: this.buildDescription(data.description),
        })),
      }
    }
    if (body.mode === 'graphql') {
      return {
        ...defaultValue,
        type: Notebook.BodyType.RAW,
        [Notebook.BodyType.RAW]: { value: JSON.stringify(body.graphql) || '', type: body.options?.raw?.language || Notebook.RawContentLang.JSON },
      }
    }
    if (body.mode === 'formdata') {
      return {
        ...defaultValue,
        type: Notebook.BodyType.FORM_DATA,
        [Notebook.BodyType.FORM_DATA]: (body.formdata|| []).map((item) => ({
          key: item.key,
          value: item.type === Notebook.FormDataPropertyType.TEXT ? item.value || '': '', //todo update when files are supported
          type: item.type as Notebook.FormDataPropertyType,
          description: this.buildDescription(item.description),
        })),
      }
    }
    if (body.mode === 'raw') {
      return {
        ...defaultValue,
        type: Notebook.BodyType.RAW,
        [Notebook.BodyType.RAW]: { value: body.raw || '', type: body.options?.raw?.language || Notebook.RawContentLang.JSON },
      }
    }
    return {
      ...defaultValue,
      type: Notebook.BodyType.RAW,
      [Notebook.BodyType.RAW]: { value: '', type: Notebook.RawContentLang.TEXT },
    }
  }

  private generateDescription(description: Description | undefined) {
    const parsedDescription = this.mdParser.parse(this.buildDescription(description))
    const blocks = generateJSON(parsedDescription, [
      StarterKit.configure({
        hardBreak: false,
      }) as any,
    ])
    return blocks.content
  }

  private generateHeading(text:string | undefined, level: number) {
    return {
      type: 'heading',
      attrs: {
        level: level > 6 ? 6 : level,
      },
      content: [{
        type: 'text',
        text: text || '',
      }],
    }
  }

  private buildHeaders(headers: RequestObject['header'], defaultValue: Notebook.ApiBlockHeaders) {
    if (!headers || typeof headers === 'string') return defaultValue

    return headers.map(({ key, value, description }) => ({
      key, value, description: this.buildDescription(description),
    }))
  }

  private generateInfoBlocks(info: { name?: string, description?: Description }, level: number) : (Blocknote.BlockElement | Blocknote.InlineElement)[] {
    const blocks: (Blocknote.BlockElement | Blocknote.InlineElement)[] = []
    if (info.name) {
      blocks.push(this.generateHeading(info.name, level))
    }
    if (info.description) {
      blocks.push(...this.generateDescription(info.description))
    }
    return blocks
  }

  private convertPostmanDataToBlockElements(item: ItemGroup | Item | Collection, level = 1, parentAuth?: Auth | null): (Blocknote.BlockElement | Blocknote.InlineElement)[] {
    if ('item' in item) {
      const blocks: (Blocknote.BlockElement | Blocknote.InlineElement)[] = []
      blocks.push(...this.generateInfoBlocks('info' in item ? item.info : item, level))
      item.item.forEach((i) => {
        blocks.push(...this.convertPostmanDataToBlockElements(i, level + 1, item.auth))
      })
      return blocks
    }

    if ('request' in item) {
      const { request } = item
      const defaultAttrs = BlocknoteTemplates.emptyApiBlock(this.buildName(item.name))

      if (typeof request === 'string') {
        const block: Notebook.ApiBlockNode = {
          type: Notebook.RUNNABLE_API_BLOCK_NAME,
          attrs: defaultAttrs,
        }
        return [block]
      }
      const block: Notebook.ApiBlockNode = {
        type: Notebook.RUNNABLE_API_BLOCK_NAME,
        attrs: {
          ...defaultAttrs,
          url: this.buildUrl(request.url),
          body: this.buildBody(request.body, defaultAttrs.body),
          method: request.method as Notebook.HttpMethodEnum || defaultAttrs.method,
          headers: this.buildHeaders(request.header, defaultAttrs.headers),
          variables: this.buildVariables(request.url, defaultAttrs.variables),
          parameters: this.buildParameters(request.url, defaultAttrs.parameters),
          authorization: this.buildAuth(request.auth || parentAuth, defaultAttrs.authorization), // IMPORTANT: Assign default value to req auth
        },
      }
      return [block]
    }
    // 'Invalid Postman item structure'
    return [...this.generateDescription('Invalid Postman item structure')]
  }

  setPostmanEnvToVariableGroupData(vars: EnvironmentVariable[], data: VariableGroupData): VariableGroupData {
    data.variables = vars.reduce((acc, variable) => {
      acc[variable.key] = {
        id: variable.id,
        name: variable.key,
        value: variable.value,
        secret: variable.type === 'secret',
      }
      return acc
    }, data.variables || {})
    return data
  }

  setPostmanCollectionToNotebookData(collection: Collection, data: Blocknote.Data): Blocknote.Data {
    if (!collection || !collection.info._postman_id) {
      throw new Error('Data is not a postman collection')
    }

    data.content = this.convertPostmanDataToBlockElements(collection, 1)
    if (collection.variable) {
      data.environments[Blocknote.SourceEnv.GLOBAL].variables = collection.variable.map((variable)=> {
        return {
          key: variable.key || variable.id || '',
          value: String(variable.value),
          description: this.buildDescription(variable.description),
          secret: false,
          source: 'global',
        }
      })
    }
    return data
  }
}