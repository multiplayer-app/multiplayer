import { parse } from 'acorn'
import { Editor } from '@tiptap/core'
import * as monaco from 'monaco-editor'
import { Notebook } from '@multiplayer/types'
import { EditorState } from '@tiptap/pm/state'
import { IDebugOptions, ISecretsManager } from 'src/types'
import { generateId, generateName, generateUniqueName, getExistingNames, parsElementAttribute } from 'src/lib/utils'

import { getCodeBlockStates, setCodeBlockState } from './plugins'
import { RunnableCodeBlockAttributes, RunnableCodeBlockState } from './types'

import { executeApiCall } from '../RestApiBlock/utils'
import { ApiBlockState } from '../RestApiBlock/types'
import { getApiBlockStates } from '../RestApiBlock/plugins'
import { JSCodeRunner } from '../RunnableBlocks/JSCodeRunner'
import { CodeExecutionDebugger } from '../RunnableBlocks/CodeExecutionDebugger'

export function runById(
  editor: Editor,
  proxy: any,
  debug: IDebugOptions,
  blockId: string,
  dynamicParams: Record<string, string> = {},
  signal?: AbortSignal,
  secretsManager?: ISecretsManager | null,
) {
  const { state } = editor
  let found: any = undefined
  state.doc.descendants(node => {
    if (node.attrs._id === blockId) {
      found = node
    }
    return false
  })
  if (!found) {
    return undefined
  }
  return executeApiCall(editor, found.attrs, proxy, debug, dynamicParams, signal, secretsManager)
}

export function getGlobalHandlers(editorState: EditorState) {
  const { handlers } = getGlobalState(editorState)
  return handlers
}

export function getGlobalState(editorState: EditorState) {
  const apiBlockState = getApiBlockStates(editorState)
  const codeBlockState = getCodeBlockStates(editorState)
  const existingNames = getExistingNames({ editorState })

  const variables = Array.from(existingNames).reduce((acc, name) => {
    acc[name] = undefined
    return acc
  }, {})

  const handlers = {}

  Object.keys(apiBlockState).forEach((key: string) => {
    const state = apiBlockState[key]
    if (state.globalName && existingNames.has(state.globalName)) {
      handlers[`$${state.globalName}`] = key
      if (state.result) variables[state.globalName] = state.result.data && JSON.parse(state.result.data)
    }
  })

  Object.values(codeBlockState).forEach((state: ApiBlockState | RunnableCodeBlockState) => {
    if (state.globalName && existingNames.has(state.globalName)) {
      variables[state.globalName] = state.result
    }
  })

  return { variables, handlers }
}

function parseCodeSafely(code: string) {
  try {
    const ast = parse(code, { ecmaVersion: 2020, locations: true })
    return ast
  } catch (error) {
    return null
  }
}

export function isPartOfStringOrComment(parent: any, node: any) {
  if (!parent) return false
  return (
    parent.type === 'Literal' ||
    parent.type === 'TemplateLiteral' ||
    (parent.type === 'Property' && parent.key === node && !parent.computed)
  )
}

export function findGlobalVariableRanges(
  code: string,
  variables: Record<string, any>,
  handlers: Record<string, any> = {},
): Record<string, monaco.IRange[]> {
  const ranges: Record<string, monaco.IRange[]> = {}
  const ast = parseCodeSafely(code)
  if (!ast) {
    return ranges
  }

  Object.keys(variables).forEach(key => {
    ranges[key] = []
  })
  Object.keys(handlers).forEach(key => {
    ranges[key] = []
  })

  function walkNode(node: any, parent: any = null) {
    if (
      node.type === 'Identifier' &&
      (variables.hasOwnProperty(node.name) || handlers.hasOwnProperty(node.name)) &&
      !isPartOfStringOrComment(parent, node)
    ) {
      const range = new monaco.Range(
        node.loc.start.line,
        node.loc.start.column + 1,
        node.loc.end.line,
        node.loc.end.column + 1,
      )
      ranges[node.name].push(range)
    }

    if (node.type === 'TemplateLiteral') {
      node.expressions.forEach((expression: any) => walkNode(expression, node))
    }

    for (const key in node) {
      const child = node[key]
      if (Array.isArray(child)) {
        child.forEach(c => walkNode(c, node))
      } else if (child && typeof child.type === 'string') {
        walkNode(child, node)
      }
    }
  }

  walkNode(ast)

  return ranges
}

const editorDecorationsMap: Map<monaco.editor.IStandaloneCodeEditor, string[]> = new Map()

export function highlightGlobalVariables(
  editor: monaco.editor.IStandaloneCodeEditor,
  variables: Record<string, any>,
  handlers: Record<string, any>,
) {
  const model = editor.getModel()
  if (!model) return

  const currentDecorations = editorDecorationsMap.get(editor) || []

  const ranges = findGlobalVariableRanges(model.getValue(), variables, handlers)

  editor.deltaDecorations(currentDecorations, [])

  const newDecorations = Object.entries(ranges).flatMap(([key, variableRanges]) =>
    variableRanges.map(range => ({
      range,
      options: {
        inlineClassName: handlers.hasOwnProperty(key) ? 'handler-decoration' : 'variable-decoration',
        hoverMessage: { value: `**Block "${key}"**` },
      },
    })),
  )

  const appliedDecorations = editor.deltaDecorations(currentDecorations, newDecorations)
  editorDecorationsMap.set(editor, appliedDecorations)
}

export async function executeBlock(options: {
  proxy: any
  editor: Editor
  debug: IDebugOptions
  signal?: AbortSignal
  attrs: RunnableCodeBlockAttributes
  secretsManager: ISecretsManager | null
}) {
  const { proxy, editor, debug, signal, attrs, secretsManager } = options
  const { view } = editor
  const codeRunner = new JSCodeRunner()
  const codeDebugger = new CodeExecutionDebugger(debug.instance, debug.runWithDebugger, {
    name: attrs._globalName,
    instrumentation: Notebook.NotebookInstrumentation.CODE,
  })
  const { variables, handlers: handlerKeys } = getGlobalState(editor.state)
  const handlers = {}

  Object.keys(handlerKeys).forEach(key => {
    handlers[key] = async (params: any) => {
      return runById(editor, proxy, debug, handlerKeys[key], params?.[0] || {}, signal, secretsManager)
    }
  })

  setCodeBlockState(view, attrs._id, { globalName: attrs._globalName, running: true, error: null })
  try {
    await codeDebugger.init()

    codeDebugger.addSpanEvent({
      name: 'Execution started',
      attributes: {},
    })

    const result = await codeRunner.executeCode(attrs.content, variables, undefined, handlers, 1000, signal)

    setCodeBlockState(view, attrs._id, { running: false, result, error: null })

    codeDebugger.addSpanAttrs({
      success: 'true',
      result: result ? JSON.stringify(result) : 'null',
    })
    codeDebugger.addSpanEvent({
      name: 'Execution finished successfully',
      attributes: {},
    })
  } catch (error: any) {
    setCodeBlockState(view, attrs._id, { running: false, result: null, error })
    codeDebugger.addSpanAttrs({
      success: 'false',
      error: JSON.stringify(error?.message ?? error),
    })
    codeDebugger.addSpanEvent({
      name: 'Execution failed',
      attributes: {},
    })
  } finally {
    codeDebugger.exportSpans()
    await codeDebugger.finish()
  }
}

export function pastedDataParser(node, editorState: EditorState) {
  const attrs: RunnableCodeBlockAttributes = node.attrs
  const existingNames = getExistingNames({ editorState, node })
  const needCopy = existingNames.has(attrs._globalName)

  return {
    ...attrs,
    ...(needCopy && {
      _id: generateId(),
      _globalName: generateUniqueName(attrs._globalName, editorState),
    }),
  }
}

export function getParsedHtmlAttributes(element: HTMLElement) {
  return {
    _id: element.getAttribute('data-id') || generateId(),
    _runnable: element.getAttribute('data-runnable') || false,
    _globalName: element.getAttribute('data-globalName') || generateName(),

    content: parsElementAttribute(element, 'data-content') || '',
    language: parsElementAttribute(element, 'data-language') || 'javascript',
  }
}
