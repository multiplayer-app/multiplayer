import * as Y from 'yjs'
import { Blocknote } from '@multiplayer/types'

export function migrateBlocknoteToV1(xml: Y.XmlFragment) {
  let element: Y.XmlElement | Y.XmlText | null = xml.firstChild
  const newData: (Blocknote.BlockElement | Blocknote.InlineElement)[] = []
  while (element !== null) {
    const data = convertYXmlToJson(element as Y.XmlElement)
    const updatedData = removeBlocknoteFields(data)
    newData.push(...updatedData)
    element = element.nextSibling
  }
  xml.delete(0, xml.length)
  xml.push([convertJsonToYXml({ type: 'doc', content: newData })])
}

function removeBlocknoteFields(element: Blocknote.BlockElement | Blocknote.InlineElement): (Blocknote.BlockElement | Blocknote.InlineElement)[] {
  if (instanceOfInlineElement(element)) {
    return [element]
  }

  const newContents = (element.content || [])
    .map((elem) => removeBlocknoteFields(elem))
    .reduce((acc, content) => {
      acc.push(...content)
      return acc
    }, [])

  if (element.type === 'blockContainer' || element.type === 'blockGroup') {
    return newContents
  }
  if (element.type === 'bulletListItem' || element.type === 'numberedListItem') {
    return [{
      type: 'paragraph',
      content: newContents,
    }]
  }

  element.content = newContents
  return [element]
}

//code is duplicated to decouple logic with possible future changes
function instanceOfInlineElement(object: any): object is Blocknote.InlineElement {
  return 'text' in object
}

function convertYXmlToJson(fragment: Y.XmlElement): Blocknote.BlockElement {
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
      const elementContent = convertYXmlToJson(childElement)
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

function convertJsonToYXml(element: Blocknote.BlockElement): Y.XmlElement | Y.XmlText {
  const parent = new Y.XmlElement(element.type)
  if (!element.content) {
    return parent
  }

  if (element.content.length &&
    instanceOfInlineElement(element.content[0])) {

    const yText = new Y.XmlText()
    let index = 0;
    (element.content as Blocknote.InlineElement[])?.forEach((innerElement: Blocknote.InlineElement) => {
      yText.insert(index, innerElement.text, convertMarksToFormat(innerElement.marks))
      index += innerElement.text.length
    })
    parent.push([yText])
  } else {
    parent.push(element.content.map((innerElement) => convertJsonToYXml(innerElement)))
  }
  return parent
}

function convertMarksToFormat(marks?: Blocknote.InlineElementMark[]) {
  if (!marks) return {}
  return marks.reduce((acc: Record<string, string | Record<string, string> >, current) => {
    acc[current.type] = current.attrs || {}
    return acc
  }, {} as Record<string, string | Record<string, string>>)
}
