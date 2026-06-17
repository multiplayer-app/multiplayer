import axios from 'axios'
import { Editor } from '@tiptap/core'
import getNestedProperty from 'lodash.get'
import hasNestedProperty from 'lodash.has'
import { Notebook } from '@multiplayer/types'
import { EditorState } from '@tiptap/pm/state'
import { BlocknoteTemplates } from '@multiplayer/entity'

import { getGlobalVars } from '../EnvironmentVariables'
import { predefinedVars } from '../../providers/VariablesProvider/predefinedVariables'
import { dataCollector } from './data-collector'

import { VARIABLE_MATCH_REGEX } from './consts'
import { getGlobalState } from '../RunnableCodeBlock/utils'

import { clone, generateId, generateUniqueName, parsElementAttribute } from 'src/lib/utils'
import { setApiBlockState } from './plugins'

import { CodeExecutionDebugger } from '../RunnableBlocks/CodeExecutionDebugger'
import { RUNNABLE_API_BLOCK_NAME } from '../../lib/constants'
import {
  ATTR_MULTIPLAYER_HTTP_REQUEST_BODY,
  ATTR_MULTIPLAYER_HTTP_REQUEST_HEADERS,
  ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY,
  ATTR_MULTIPLAYER_HTTP_RESPONSE_HEADERS,
  SessionRecorderSdk,
} from '@multiplayer-app/session-recorder-common'
import { IDebugOptions, ISecretsManager } from 'src/types'

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function base64ToFile(base64: string, fileName: string, mimeType: string): File {
  const byteString = atob(base64.split(',')[1])
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }
  return new File([uint8Array], fileName, { type: mimeType })
}

export function getAttributeState(attributes: Notebook.RestApiBlockAttributes, key: Notebook.AttributesTab) {
  switch (key) {
    case Notebook.AttributesTab.BODY:
      return getBodyAttributeState(attributes)
    case Notebook.AttributesTab.AUTHORIZATION:
      return attributes.authorization.type === Notebook.AuthorizationType.NONE ? false : true
    case Notebook.AttributesTab.HEADERS:
      return attributes.headers.filter(({ key, value }) => key && value).length
    case Notebook.AttributesTab.VARIABLES:
      return attributes.variables.filter(({ key, value }) => key && value).length
    case Notebook.AttributesTab.PARAMETERS:
      return attributes.parameters.filter(({ key, value }) => key && value).length
    default:
      return 0
  }
}

export function getBodyAttributeState(attributes: Notebook.RestApiBlockAttributes) {
  switch (attributes.body.type) {
    case Notebook.BodyType.NONE:
      return false
    case Notebook.BodyType.FORM_DATA:
    case Notebook.BodyType.URL_ENCODED:
      return attributes.body[attributes.body.type]?.filter(({ key, value }) => key && value).length
    case Notebook.BodyType.RAW:
      return !!attributes.body[attributes.body.type]?.value
    case Notebook.BodyType.BINARY:
      return !!attributes.body[attributes.body.type]
    default:
      return true
  }
}

export function replaceAttrVariable(oldVar: string, newVar: string) {
  return (str: string = ''): string => {
    return str.replace(VARIABLE_MATCH_REGEX, (_, key: string) => {
      const base = extractVariableName(key, 0)
      return `{{${base === oldVar ? key.replace(base, newVar) : key}}}`
    })
  }
}

export function resolveVariable(variables: Record<string, any>) {
  return (str: string = ''): string => {
    return str.replace(VARIABLE_MATCH_REGEX, (_, key) => {
      const value = getNestedProperty(variables, key.trim())
      return value ?? `{{${key}}}`
    })
  }
}

export function decodeBase64AndCalcSize(base64String) {
  try {
    const decodedString = atob(base64String)
    const sizeInBytes = new Blob([decodedString]).size

    let size
    if (sizeInBytes < 1024) {
      size = `${sizeInBytes}B`
    } else if (sizeInBytes < 1024 * 1024) {
      size = `${(sizeInBytes / 1024).toFixed(2)}KB`
    } else {
      size = `${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`
    }

    return {
      data: parsResponseData(decodedString),
      size,
    }
  } catch (error) {
    return { data: base64String, size: '0B' }
  }
}

function parsResponseData(resString) {
  try {
    return JSON.stringify(JSON.parse(resString), null, 2)
  } catch (error) {
    return resString
  }
}

export function formatDuration(duration: number, toFixed = 2) {
  if (duration < 1000) {
    return `${duration.toFixed(0)}ms`
  } else {
    return `${(duration / 1000).toFixed(toFixed)}s`
  }
}

export function getCollectedData(
  attributes,
  editor,
  dynamicParams: Record<string, string> = {},
  secrets: Notebook.SecretsManagerRecord[] = [],
) {
  const variablesMap = {}
  const globalState = getGlobalState(editor.state).variables
  const requestVars = attributes.variables?.filter(v => v.key && v.value) || []
  const globalVars = getGlobalVars(editor.state).filter(v => v.key && v.value)

  predefinedVars.forEach(({ key, getValue }) => {
    variablesMap[key] = getValue()
  })
  globalVars.forEach(({ key, value }) => {
    variablesMap[key] = value
  })
  secrets.forEach(({ key, value }) => {
    variablesMap[key] = value
  })
  requestVars.forEach(({ key, value }) => {
    variablesMap[key] = value
  })
  Object.keys(globalState).forEach(key => {
    variablesMap[key] = globalState[key]
  })
  Object.keys(dynamicParams).forEach(key => {
    variablesMap[key] = dynamicParams[key]
  })
  const resolver = resolveVariable(variablesMap)
  return dataCollector(attributes, resolver)
}

export async function makeApiRequest(proxy: any, requestData: any, signal?: AbortSignal): Promise<any> {
  if (!proxy) {
    throw new Error('Proxy configuration is missing.')
  }

  const { apiInstance, path } = proxy

  if (apiInstance) {
    return apiInstance.post(path, requestData, { signal }).catch(error => {
      if (axios.isCancel(error)) {
        throw new Error('Request canceled')
      }
      throw error
    })
  } else if (typeof fetch === 'function') {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
      signal,
    })
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return response.json()
  } else {
    throw new Error('No valid proxy API instance or fetch available.')
  }
}

export const getVariableErrors = (
  attributes: Notebook.AttributeComponentProps['attributes'],
  variables: Notebook.AggregateVariable[],
) => {
  const sourcesToCheck = {
    url: attributes.url,
    headers: attributes.headers,
    parameters: attributes.parameters,
    body: attributes.body[attributes.body.type],
    authorization: attributes.authorization[attributes.authorization.type],
  }
  const varValues = getVariablesValues(variables)
  const variableReferences = Object.entries(sourcesToCheck).flatMap(([sourceKey, source]) =>
    extractVariableReferences(source, sourceKey),
  )

  const errors: { type: 'missing' | 'empty'; message: string; variable: string; path: string }[] = []

  variableReferences.forEach(({ variable, path }) => {
    if (!hasNestedProperty(varValues, variable)) {
      errors.push({
        type: 'missing',
        message: `Variable {{${variable}}} is referenced but not found.`,
        variable,
        path,
      })
    } else if (!getNestedProperty(varValues, variable)) {
      errors.push({
        type: 'empty',
        message: `Variable {{${variable}}} is found but has no value.`,
        variable,
        path,
      })
    }
  })

  return errors
}

export const extractVariableReferences = (
  content: any,
  currentPath: string = '',
): { variable: string; path: string }[] => {
  if (typeof content === 'string') {
    const matches = content.match(VARIABLE_MATCH_REGEX)?.map(match => match.replace(/[{}]/g, '').trim()) || []

    return matches.map(variable => ({ variable, path: currentPath }))
  }

  if (Array.isArray(content)) {
    return content.flatMap((item, index) => extractVariableReferences(item, `${currentPath}[${index}]`))
  }

  if (typeof content === 'object' && content !== null) {
    return Object.entries(content).flatMap(([key, value]) => extractVariableReferences(value, `${currentPath}.${key}`))
  }

  return []
}

export const convertVariablesToObject = (
  vars: Notebook.AggregateVariable[],
): Record<string, Notebook.AggregateVariable> =>
  // Use reduceRight to ensure that local variables are prioritized.
  vars.reduceRight((acc, item) => {
    acc[item.key] = item
    return acc
  }, {})

export const getVariablesValues = (vars: Notebook.AggregateVariable[]): Record<string, any> =>
  // Use reduceRight to ensure that local variables are prioritized.
  vars.reduceRight((acc, item) => {
    acc[item.key] = item.value
    return acc
  }, {})

// Extract key between {{` and `}}` and parse the variable string to return first key
// (e.g., {{varName.arrayProp[0].nested}})
export const extractVariableName = (key: string, slice = 2): string =>
  key.slice(slice, slice ? -slice : undefined).split(/[\[.]/)[0]

export function pastedDataParser(node, editorState: EditorState) {
  const attrs: Notebook.RestApiBlockAttributesStringified = node.attrs
  const uniqueName = generateUniqueName(attrs._globalName, editorState)
  const emptyBlock = BlocknoteTemplates.emptyApiBlock(uniqueName)

  return {
    ...attrs,
    _id: generateId(),
    _globalName: uniqueName,
    body: parseAttr(attrs.body, emptyBlock.body),
    headers: parseAttr(attrs.headers, emptyBlock.headers),
    variables: parseAttr(attrs.variables, emptyBlock.variables),
    parameters: parseAttr(attrs.parameters, emptyBlock.parameters),
    authorization: parseAttr(attrs.authorization, emptyBlock.authorization),
  }
}

export function parseAttr(attr, defaultValue) {
  return attr ? (typeof attr === 'string' ? JSON.parse(attr) : attr) : defaultValue
}

export function getParsedHtmlAttributes(element: HTMLElement) {
  return {
    _id: element.getAttribute('data-id'),
    _runnable: element.getAttribute('data-runnable'),
    _globalName: element.getAttribute('data-globalName'),

    url: parsElementAttribute(element, 'data-url'),
    body: parsElementAttribute(element, 'data-body'),
    method: parsElementAttribute(element, 'data-method'),
    headers: parsElementAttribute(element, 'data-headers'),
    variables: parsElementAttribute(element, 'data-variables'),
    parameters: parsElementAttribute(element, 'data-parameters'),
    authorization: parsElementAttribute(element, 'data-authorization'),
  }
}

export async function executeApiCall(
  editor: Editor,
  attrs: Notebook.RestApiBlockAttributes,
  proxy: any,
  debug: IDebugOptions,
  dynamicParams: Record<string, string> = {},
  signal?: AbortSignal,
  secretsManager?: ISecretsManager | null,
) {
  const codeDebugger = new CodeExecutionDebugger(debug.instance, debug.runWithDebugger, {
    name: `${RUNNABLE_API_BLOCK_NAME}: ${attrs._globalName}`,
    instrumentation: Notebook.NotebookInstrumentation.HTTP,
  })
  try {
    await codeDebugger.init()
    const secrets = secretsManager ? await secretsManager?.getAllSecrets() : []
    const requestData = getCollectedData(attrs, editor, dynamicParams, secrets)
    await applyDebugHeadersIfNeeded(debug, requestData, codeDebugger.spanId)
    const maskBodyFn = SessionRecorderSdk.mask(SessionRecorderSdk.sensitiveFields)
    const maskHeadersFn = SessionRecorderSdk.mask(SessionRecorderSdk.sensitiveHeaders)
    codeDebugger.addSpanAttrs({
      'http.method': requestData.method,
      'http.url': requestData.url,
      'multiplayer.http.request.params': JSON.stringify(requestData.params),
      [ATTR_MULTIPLAYER_HTTP_REQUEST_BODY]: maskBodyFn(clone(requestData.data)),
      [ATTR_MULTIPLAYER_HTTP_REQUEST_HEADERS]: maskHeadersFn(clone(requestData.headers)),
    })

    const res = await makeApiRequest(proxy, requestData, signal)
    const result = {
      ...res,
      ...decodeBase64AndCalcSize(res.data),
    }

    codeDebugger.addSpanAttrs({
      'http.status_code': result.status,
      'http.status_text': result.statusText,
      'http.response_content_length': result.headers?.['content-length'] || 0,
      [ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY]: maskBodyFn(clone(result.data)),
      [ATTR_MULTIPLAYER_HTTP_RESPONSE_HEADERS]: maskHeadersFn(clone(result.headers)),
    })
    return { result, error: null }
  } catch (error) {
    codeDebugger.addSpanAttrs({
      error: JSON.stringify(error),
    })
    return { error, result: null }
  } finally {
    codeDebugger.exportSpans()
    await codeDebugger.finish()
  }
}

export async function executeBlock(params: {
  proxy: any
  editor: Editor
  debug: IDebugOptions
  attrs: Notebook.RestApiBlockAttributes
  signal?: AbortSignal
  dynamicParams?: Record<string, string>
  secretsManager?: ISecretsManager | null
}) {
  const { editor, attrs, proxy, debug, dynamicParams, signal, secretsManager } = params
  setApiBlockState(editor.view, attrs._id, { globalName: attrs._globalName, running: true })
  const { result, error } = await executeApiCall(editor, attrs, proxy, debug, dynamicParams, signal, secretsManager)

  setApiBlockState(editor.view, attrs._id, { running: false, error, result })
}

async function applyDebugHeadersIfNeeded(
  debug: IDebugOptions,
  requestData: { headers: Record<string, string> },
  spanId?: string,
) {
  try {
    const { instance, runWithDebugger } = debug
    if (!instance) return

    const isDebugMode = instance.getSession() || runWithDebugger
    if (!isDebugMode) return

    if (!instance.getSession()) {
      await instance.startSession()
    }

    instance.getDebugHeaders(spanId).forEach(header => {
      requestData.headers[header.key] = header.value
    })
  } catch (error) {
    console.log('Failed to initialize debugger:', error)
  }
}

async function stopDebuggerIfNeeded(debug: IDebugOptions, hasActiveSession: boolean) {
  const { instance, runWithDebugger } = debug
  if (!instance || !runWithDebugger || (runWithDebugger && hasActiveSession)) return

  try {
    await instance.stopSession()
  } catch (error) {
    console.error('Failed to stop debugger:', error)
  }
}
export const isUrl = (str: string) => {
  try {
    new URL(str)
    return true
  } catch (_) {
    return false
  }
}
