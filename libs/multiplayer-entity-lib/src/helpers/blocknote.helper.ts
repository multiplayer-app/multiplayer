import * as Y from 'yjs'
import { Blocknote, Notebook } from '@multiplayer/types'
import { BlocknoteTemplates } from '../templates'
import { BlockElement } from '@multiplayer/types/dist/entity-data/notebook-data'


export class BlocknoteHelper {
  static convertYXmlFragmentToJson(fragment: Y.XmlFragment): Blocknote.BlockElement {
    const allBlocks: (Blocknote.BlockElement | Blocknote.InlineElement)[] = []
    let element: Y.XmlElement | Y.XmlText | null = fragment.firstChild
    while (element !== null) {
      const data = BlocknoteHelper.convertYXmlToJson(element as Y.XmlElement)
      allBlocks.push(data)
      element = element.nextSibling
    }
    if (allBlocks.length === 1 && allBlocks[0].type === 'doc') {
      return allBlocks[0]
    }
    return { type: 'doc', content: allBlocks }
  }

  static convertYXmlToJson(fragment: Y.XmlElement): Blocknote.BlockElement {
    let content = [] as Blocknote.BlockElement[]
    let childElement = fragment.firstChild
    while (childElement !== null) {
      if (childElement instanceof Y.XmlText) {
        const deltas = childElement.toDelta()
        content = deltas.map((delta) =>{
          const inlineElem: Blocknote.InlineElement = {
            type: 'text',
            text: delta.insert,
          }

          if (delta.attributes) {
            inlineElem.marks = Object.keys(delta.attributes).map((key) => {
              const mark: Blocknote.InlineElementMark = { type: key }
              if (Object.keys(delta.attributes[key]).length !== 0) {
                mark.attrs = delta.attributes[key]
              }
              return mark
            })
          }
          return inlineElem
        })
      }
      else {
        const elementContent = BlocknoteHelper.convertYXmlToJson(childElement)
        content.push(elementContent)
      }

      childElement = childElement.nextSibling
    }

    const elem: Blocknote.BlockElement = {
      type: fragment.nodeName,
    }
    if (content.length) {
      elem.content = content
    }

    const attrs = fragment.getAttributes()
    if (Object.keys(attrs).length !== 0) {
      elem.attrs = attrs as Record<string, string>
    }

    return elem
  }

  static convertJsonToYXml(element: Blocknote.BlockElement): Y.XmlElement | Y.XmlText {
    const parent = new Y.XmlElement(element.type)

    if (element.attrs) {
      const attrs = element.attrs || {}
      Object.keys(attrs).forEach((key) => {
        (parent as Y.XmlElement).setAttribute(key, attrs[key])
      })
    }

    if (!element.content) {
      return parent
    }

    if (element.content.length &&
      BlocknoteHelper.instanceOfInlineElement(element.content[0])) {

      const yText = new Y.XmlText()
      let index = 0;
      (element.content as Blocknote.InlineElement[])?.forEach((innerElement: Blocknote.InlineElement) => {
        yText.insert(index, innerElement.text, BlocknoteHelper.convertMarksToFormat(innerElement.marks))
        index += innerElement.text.length
      })
      parent.push([yText])
    } else {
      parent.push(element.content.map((innerElement) => BlocknoteHelper.convertJsonToYXml(innerElement)))
    }
    return parent
  }

  static instanceOfInlineElement(object: any): object is Blocknote.InlineElement {
    return 'text' in object
  }

  static convertMarksToFormat(marks?: Blocknote.InlineElementMark[]) {
    if (!marks) return {}
    return marks.reduce((acc: Record<string, string | Record<string, string> >, current) => {
      acc[current.type] = current.attrs || {}
      return acc
    }, {} as Record<string, string | Record<string, string>>)
  }

  static convertToRestApiBlock(result: {
    _globalName: string,
    url: string,
    method: string,
    headers: Record<string, string>,
    authentication: {
      type: string,
      name: string,
      in: 'header' | 'query' | 'cookie',
      value: string
    }[],
    parameters: Record<string, boolean | number | string>,
    body: Record<string, any>
  }, blockToAdj?: BlockElement): BlockElement {
    const block = blockToAdj?.attrs || BlocknoteTemplates.emptyApiBlock(result._globalName || '')
    block.url = result.url || block.url || ''
    block.method = Notebook.HttpMethodEnum[result.method] || block.method
    block.headers = result.headers ? Object.keys(result.headers).map((key) => ({
      key,
      value: result.headers[key],
    })) : block.headers
    block.parameters = result.parameters ? Object.keys(result.parameters).map((key) => ({
      key,
      value: JSON.stringify(result.parameters[key]),
      description: '',
    })) : block.parameters

    if (result.body) {
      block.body.type = Notebook.BodyType.RAW
      block.body[Notebook.BodyType.RAW] = {
        value: JSON.stringify(result.body),
        type: Notebook.RawContentLang.JSON,
      }
    }

    result.authentication?.forEach((authentication) => {
      switch (authentication.type) {
        case 'cookie':
          block.headers.push({
            key: 'Cookie',
            value: authentication.value,
            description: 'Auth cookie',
          })
          break
        case 'basic':
          block.authorization.type = Notebook.AuthorizationType.BASIC
          block.authorization[Notebook.AuthorizationType.BASIC] = {
            username: '{{USERNAME}}',
            password: '{{PASSWORD}}',
          }
          break
        case 'apiKey':
          block.authorization.type = Notebook.AuthorizationType.API_KEY
          block.authorization[Notebook.AuthorizationType.API_KEY] = {
            key: authentication.name || '',
            value: authentication.value || '',
            addTo: authentication.in as Notebook.AuthorizationAddTo || Notebook.AuthorizationAddTo.HEADER,
          }
          break
        case 'bearer':
        case 'oauth2':
        case 'openIdConnect':
          block.authorization.type = Notebook.AuthorizationType.BEARER_TOKEN
          block.authorization[Notebook.AuthorizationType.BEARER_TOKEN] = {
            token: authentication.value || '',
          }
          break
      }
    })

    return {
      type: 'restApiBlock',
      attrs: block,
    }
  }
}
