import { Editor } from '@tiptap/core'
import { EditorState } from '@tiptap/pm/state'
import { generateId, generateName, generateUniqueName, getExistingNames, parsElementAttribute } from 'src/lib/utils'
import { setSqlBlockState } from './plugins'
import { SqlBlockAttributes, SqlQueryExecutor, SqlQueryResult } from './types'

const DEFAULT_QUERY = 'SELECT * FROM users LIMIT 10;'

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (error && typeof error === 'object') {
    const responseMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message
    if (responseMessage) {
      return responseMessage
    }
    const bodyMessage = (error as { body?: { message?: string } }).body?.message
    if (bodyMessage) {
      return bodyMessage
    }
  }
  return String(error)
}

export function createProxySqlExecutor(proxy: { apiInstance?: any; path: string }): SqlQueryExecutor {
  return async (query: string, signal?: AbortSignal) => {
    const { apiInstance, path } = proxy
    const start = performance.now()

    try {
      let response: SqlQueryResult
      if (apiInstance) {
        response = await apiInstance.post(path, { query }, { signal })
      } else if (typeof fetch === 'function') {
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || `SQL request failed with status ${res.status}`)
        }
        response = await res.json()
      } else {
        throw new Error('SQL proxy is not configured')
      }

      return {
        ...response,
        durationMs: response.durationMs ?? Math.round(performance.now() - start),
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      throw new Error(extractErrorMessage(error))
    }
  }
}

export async function executeSqlBlock(options: {
  editor: Editor
  attrs: SqlBlockAttributes
  executeQuery: SqlQueryExecutor
  signal?: AbortSignal
}) {
  const { editor, attrs, executeQuery, signal } = options
  const { view } = editor
  const query = attrs.query?.trim()

  if (!query) {
    setSqlBlockState(view, attrs._id, { running: false, error: 'Query is empty', result: null })
    return
  }

  setSqlBlockState(view, attrs._id, { globalName: attrs._globalName, running: true, error: null })

  try {
    const result = await executeQuery(query, signal)
    setSqlBlockState(view, attrs._id, { running: false, result, error: null })
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      setSqlBlockState(view, attrs._id, { running: false, error: 'Query canceled', result: null })
      return
    }
    setSqlBlockState(view, attrs._id, { running: false, result: null, error: extractErrorMessage(error) })
  }
}

export function pastedDataParser(node: { attrs: SqlBlockAttributes }, editorState: EditorState) {
  const attrs = node.attrs
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

export function getParsedHtmlAttributes(element: HTMLElement): SqlBlockAttributes {
  return {
    _id: element.getAttribute('data-id') || generateId(),
    _runnable: element.getAttribute('data-runnable') !== 'false',
    _globalName: element.getAttribute('data-globalName') || generateName(),
    query: parsElementAttribute(element, 'data-query') || DEFAULT_QUERY,
  }
}

export { DEFAULT_QUERY }
