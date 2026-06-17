import { Editor, Node } from '@tiptap/core'
import { EditorState } from '@tiptap/pm/state'
import { RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME } from 'src/lib/constants'

export const runnableBlocks = new Set([RUNNABLE_API_BLOCK_NAME, RUNNABLE_CODE_BLOCK_NAME])

export function generateId(): string {
  return `${Date.now()}-${Math.random()}`
}

export function generateName(): string {
  return Date.now().toString()
}

export function clone(node) {
  return JSON.parse(JSON.stringify(node))
}

export function getNameCopy(nodeName, editorState: EditorState): string {
  const existingNames = getExistingNames({ editorState })
  const newName = `${nodeName}_copy`
  return !existingNames.has(newName) ? newName : getNameCopy(newName, editorState)
}

export function getExistingNames({
  node,
  blockType,
  editorState,
}: {
  node?: any // Exclude node
  blockType?: string // Type filter
  editorState: EditorState
}): Set<string> {
  const existingNames = new Set<string>()

  editorState.doc.descendants(n => {
    const globalName = n.attrs?._globalName
    if (globalName && (!blockType || n.type.name === blockType) && (!node || node !== n)) {
      existingNames.add(globalName)
    }
  })

  return existingNames
}

export function generateGlobalName(editorState: EditorState, blockType: string, prefix: string): string {
  const existingNames = getExistingNames({ editorState, blockType })

  const maxNumber = Array.from(existingNames)
    .map(name => parseInt(name.replace(prefix, ''), 10))
    .filter(num => !isNaN(num))
    .reduce((max, num) => Math.max(max, num), 0)

  return `${prefix}${maxNumber + 1}`
}

export function generateUniqueName(name: string, editorState: EditorState): string {
  const existingNames = getExistingNames({ editorState })

  if (!existingNames.has(name)) {
    return name
  }

  let counter = 1
  let newName = `${name}${counter}`

  while (existingNames.has(newName)) {
    counter++
    newName = `${name}${counter}`
  }

  return newName
}

export function getRunnableBlocks(editorState: EditorState, type?: string, includeRunnable = true) {
  const nodes: any[] = []

  editorState.doc.descendants(node => {
    if (includeRunnable && !node.attrs._runnable) return
    if (!type ? runnableBlocks.has(node.type.name) : type === node.type.name) {
      nodes.push(node)
    }
  })
  return nodes
}

export function findReferencesInCode(globalName: string, code: string): boolean {
  const regex = new RegExp(`\\b${globalName}\\b`, 'g')
  return regex.test(code)
}

export function fundReferenceBlocks(editor: Editor, globalName: string): Node[] {
  return getRunnableBlocks(editor.state, RUNNABLE_CODE_BLOCK_NAME).filter(node =>
    findReferencesInCode(globalName, node.attrs.content),
  )
}

export function getDeclarationType(value) {
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const elementType = getDeclarationType(value[0])
      return `${elementType}[]`
    }
    return 'any[]'
  } else if (typeof value === 'object' && value !== null) {
    const properties = Object.entries(value)
      .map(([key, val]) => `${key}: ${getDeclarationType(val)};`)
      .join(' ')
    return `{ ${properties} }`
  } else if (typeof value === 'string' && value === 'function') {
    return '(...args: any[]) => void'
  }

  return typeof value === 'string'
    ? 'string'
    : typeof value === 'number'
      ? 'number'
      : typeof value === 'boolean'
        ? 'boolean'
        : 'any'
}
export function generateGlobalDeclarations({ variables, handlers }, usePromise = false) {
  const vars = Object.entries(variables)
    .map(([key, value]) => `declare const ${key}: ${getDeclarationType(value)};`)
    .join('\n')

  const functions = Object.entries(handlers)
    .map(
      ([key]) =>
        `declare function ${key}(variablesToOverride: Record<string, string>): ${usePromise ? 'Promise<any>' : '{result: any, error: any}'}`,
    )
    .join('\n')

  return `${vars}\n${functions}`
}

export function getVariableParsedValue(value: any): string {
  if (!value) return ''
  switch (typeof value) {
    case 'function':
      return value()
    case 'object':
      return truncateText(JSON.stringify(value, null, 4))
    default:
      return value
  }
}

function truncateText(text, maxLength = 200) {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

export function parsElementAttribute(element, attrName: string) {
  const attr = element.getAttribute(attrName)
  try {
    return JSON.parse(attr)
  } catch (error) {
    return attr
  }
}
