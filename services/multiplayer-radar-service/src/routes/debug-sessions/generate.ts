import type { Request, Response, NextFunction } from 'express'
import { s3 } from '@multiplayer/s3'
import { Blocknote,
  OtelScope,
  DebugSessionDataType,
  DebugSessionNodeType,
  IDebugSessionNode,
  EntityType,
  ErrorMessage,
  ITraceData,
  Notebook,
} from '@multiplayer/types'
import { Readable } from 'stream'
import logger from '@multiplayer/logger'
import StreamArray from 'stream-json/streamers/StreamArray'
import { BlocknoteHelper, BlocknoteTemplates } from '@multiplayer/entity'
import { DebugSessionService, VersionService } from '../../services'
import { IDebugSessionDocument, ProjectBranchModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { PassThrough } from 'node:stream'
import { openai } from '../../libs'
import { DEFAULT_MODEL_NAME, MULTIPLAYER_BASE_API_URL } from '../../config'

/**
 * Generate notebook from debug session traces
 *
 * @param req.query.auth - Optional authentication type for generated blocks
 *   Valid values: Notebook.AuthSchemaType.BEARER, Notebook.AuthSchemaType.BASIC, Notebook.AuthSchemaType.API_KEY, Notebook.AuthSchemaType.COOKIE
 */
export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const debugSessionId = req.params.debugSessionId as string
    const { auth } = req.query

    const debugSession = req.debugSession

    const blocks: Blocknote.BlockElement[] = [
      {
        type: 'heading',
        attrs: { timestamp: 0 },
        content: [{
          type: 'text',
          text: debugSession.name,
        }, {
          type: 'text',
          text: ' #',
          marks: [{
            type: 'link',
            attrs: {
              href: `${MULTIPLAYER_BASE_API_URL}/project/${debugSession.workspace}/${debugSession.project}/default/debugger/session/${debugSession._id}`,
            },
          }],
        }],
      },
    ]
    const traces: ITraceData[] = []
    const envs: string[] = []
    const envsWithValues: Record<string, string> = {}

    const authConfig = parseAuthQueryParam(auth as string)

    const traceProcessor = (trace: ITraceData) => {
      try {
        traces.push(trace)
        const data = convertTraceToBlock(trace as ITraceData, authConfig, envsWithValues)
        if (!data) return
        blocks.push(data.block)
        envs.push(...data.env)
        Object.assign(envsWithValues, data.envWithValues)
      } catch (e) {
        logger.error(e)
      }
    }
    const onTraceEndProcessor = async () => {
      try {
        const processedTraces = buildTraceTree(
          traces.map((t:ITraceData) =>
            t.ScopeName === OtelScope.userInteraction
              ? newDebugSessionNode<ITraceData>(DebugSessionNodeType.Event, t)
              : newDebugSessionNode<ITraceData>(DebugSessionNodeType.Trace, t),
          )
            .sort((a:IDebugSessionNode<any>, b:IDebugSessionNode<any>) => a.timestamp - b.timestamp)
            .filter((node) => {
              return node.meta.StatusCode === 'STATUS_CODE_ERROR' ||
              node.meta['Events.Name'].includes('error') ||
              Number.parseInt(node.meta.SpanAttributes['http.status_code']) >= 500 ||
              !node.meta.ParentSpanId
            }),
        ).map(minimizeNodeData)
        const aiResp = await generateAiDescriptions(debugSession, processedTraces)
        if (aiResp.summary) {
          blocks.push({
            type: 'paragraph',
            attrs: { timestamp: 1 },
            content: [{
              type: 'text',
              text: aiResp.summary,
            }],
          })
        }
        blocks.push(...(aiResp.blocks || []).map((block) => ({
          type: 'paragraph',
          attrs: { timestamp: block.timestamp },
          content: [{
            type: 'text',
            text: block.description,
          }],
        })))
        const entityCreateResp = await createNotebook(blocks, new Set([...envs, ...Object.keys(envsWithValues)]), envsWithValues, debugSession, req.headers.cookie)
        res.status(200).json(entityCreateResp)
      } catch (err) {
        return next(err)
      }
    }

    if (debugSession.s3Files?.length) {
      const traceFiles = debugSession.s3Files.filter(({ dataType }) => {
        return dataType === DebugSessionDataType.OTLP_TRACES
      })
      const streams = await Promise.all(traceFiles.map((traceFile) => s3.downloadFile(traceFile.key, traceFile.bucket)))
      let finishedCounter = 0
      streams.forEach((s3Stream) => {
        if (!s3Stream.Body) return
        (s3Stream.Body as any)
          .pipe(StreamArray.withParser())
          .on('data', (data: any) => {
            traceProcessor(data.value as ITraceData)
          })
          .on('end', () => {
            ++finishedCounter
            if (finishedCounter === streams.length) {
              onTraceEndProcessor()
            }
          })
      })
    } else {
      const filter = {
        workspaceId, projectId, debugSessionId,
      }
      const stream = await DebugSessionService.listDebugSessionTraces(filter) as Readable
      const passthrough = new PassThrough({ objectMode: true })
      passthrough
        .on('data', (data) => {
          data.forEach((item) => traceProcessor(item.json()))
        })
        .on('end', onTraceEndProcessor)

      stream.pipe(passthrough)
    }

  } catch (err) {
    return next(err)
  }
}

function filterOtelHeaders(headers: Record<string, any>): Record<string, any> {
  const otelHeaders = new Set([
    'traceparent',
    'tracestate',
    'baggage',
    'x-trace-id',
    'x-span-id',
    'x-parent-span-id',
  ])

  const filteredHeaders: Record<string, any> = {}

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()
    if (!otelHeaders.has(lowerKey)) {
      filteredHeaders[key] = value
    }
  }

  return filteredHeaders
}

function replaceMaskedValues(obj: any): { result: any, maskedFields: string[] } {
  const maskedFields = new Set<string>()

  function traverse(current, parentKey = '') {
    if (Array.isArray(current)) {
      return current.map((item, index) => {
        const keyName = `${parentKey}_${index}`
        if (item === 'MASKED') {
          maskedFields.add(keyName)
          return `{{${keyName}}}`
        }
        return traverse(item, keyName)
      })
    } else if (current !== null && typeof current === 'object') {
      const result = {}
      for (const [key, value] of Object.entries(current)) {
        if (value === 'MASKED') {
          maskedFields.add(key)
          result[key] = `{{${key}}}`
        } else {
          result[key] = traverse(value, key)
        }
      }
      return result
    } else {
      return current
    }
  }

  const newObj = traverse(obj)
  return { result: newObj, maskedFields: Array.from(maskedFields) }
}

function isIdSegment(segment: string): boolean {
  // Check for numeric IDs
  if (/^\d+$/.test(segment)) return true

  // Check for UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return true

  // Check for ObjectID format (24 hex characters)
  if (/^[0-9a-f]{24}$/i.test(segment)) return true

  return false
}

function identifyIdType(previousSegment: string): string {
  // Convert plural to singular and create ID name
  const singular = previousSegment.replace(/s$/, '') // Remove trailing 's'
  const resourceName = singular || 'resource'
  return `${resourceName.toUpperCase()}_ID`
}

function extractEnvFromUrl(url: string, existingEnv: Record<string, string>): { env: Record<string, string>, url: string } {
  const urlObj = new URL(url)
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`
  const hostname = urlObj.hostname.replace(/\./g, '_')

  const baseUrlEnv = `BASE_URL_${hostname}`
  const env = { [baseUrlEnv]: baseUrl }

  const pathSegments = urlObj.pathname.split('/')
  const newPathSegments: string[] = []

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]
    const previousSegment = i > 0 ? pathSegments[i - 1] : ''

    if (isIdSegment(segment)) {
      const idType = identifyIdType(previousSegment)
      let idVar = `${idType}_${hostname}`
      if (existingEnv[idVar] && existingEnv[idVar] !== segment) {
        idVar = getNameWithNextIndex(idVar, segment, { ...existingEnv, ...env })
      }
      env[idVar] = segment
      newPathSegments.push(`{{${idVar}}}`)
    } else {
      newPathSegments.push(segment)
    }
  }
  const newPathname = newPathSegments.join('/')
  const updatedUrl = url.replace(baseUrl, `{{${baseUrlEnv}}}`).replace(urlObj.pathname, newPathname)

  return {
    env, url: updatedUrl,
  }
}

function getNameWithNextIndex(varName: string, varValue: string, existingEnv: Record<string, string>) {
  let index = 1
  let indexedName = `${varName}_${index}`
  while (existingEnv[indexedName] && existingEnv[indexedName] !== varValue) {
    ++index
    indexedName = `${varName}_${index}`
  }

  return indexedName
}

function convertTraceToBlock(trace: ITraceData, authConfig: {
  type: string,
  name: string,
  in: 'header' | 'query' | 'cookie',
  value: string
}[], existingEnv: Record<string, string>): { block: Blocknote.BlockElement, env: string[], envWithValues: Record<string, string> } | undefined {
  try {
    if (trace.SpanKind !== '3' || !trace.SpanAttributes['http.method'] || trace.ParentSpanId)
      return undefined

    const url = trace.SpanAttributes['http.url']
    const urlParams = extractEnvFromUrl(url, existingEnv)

    const rawHeaders = getParsed(trace.SpanAttributes['multiplayer.http.request.headers'], {})
    const filteredHeaders = filterOtelHeaders(rawHeaders)
    const headers = replaceMaskedValues(filteredHeaders)
    const body = replaceMaskedValues(
      getParsed(trace.SpanAttributes['multiplayer.http.request.body'], undefined))

    const block = BlocknoteHelper.convertToRestApiBlock({
      _globalName: `${toMethodName(trace.SpanAttributes['http.method'], url)}`,
      url: urlParams.url,
      method: trace.SpanAttributes['http.method'],
      headers: headers.result,
      authentication: authConfig.map((config) => ({
        ...config,
        value: `{{${config.value}}}`,
      })),
      parameters: {},
      body: body.result,
    })
    if (block.attrs) {
      block.attrs.timestamp = parseDate(trace.Timestamp)
    }
    return { block, env: [...headers.maskedFields, ...body.maskedFields], envWithValues: urlParams.env }
  } catch (e) {
    logger.error(e)
    return undefined
  }
}

function getTime(dateStr: string) {
  const date = new Date(dateStr)
  const nanos = extractNanos(dateStr)
  return date.getTime() + nanos / 1000000
}

function compareDateTimeStrings(date1: string | number, date2: string | number) {
  const time1 = (typeof date1 === 'number') ? date1 : getTime(date1)
  const time2 = (typeof date2 === 'number') ? date2 : getTime(date2)

  if (time1 <= time2) {
    return -1
  } else if (time1 > time2) {
    return 1
  } else {
    return 0
  }
}

function extractNanos(dateString: string) {
  try {
    const match = dateString.match(/\.(\d+)Z/)
    return match ? parseInt(match[1], 10) : 0
  } catch (err) {
    return 0
  }
}

function toMethodName(method: string, rawUrl: string): string {
  const url = new URL(rawUrl)
  const pathSegments = url.pathname
    .split('/')
    .filter(s => s && !s.match(/^[0-9a-fA-F]*$/)) // Filter out ObjectIDs

  if (pathSegments.length === 0) return method.toLowerCase()

  const last = pathSegments[pathSegments.length - 1]

  const pascal = last
    .split('[-.]')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  return method.toLowerCase() + pascal
}

async function createNotebook(blocks: Blocknote.BlockElement[], env: Set<string>, envsWithValues: Record<string, string>, debugSession: IDebugSessionDocument, cookie: string | undefined) {
  const notebook = BlocknoteTemplates.empty(debugSession.name)

  notebook.environments[Blocknote.SourceEnv.GLOBAL].variables = Array.from(env).map((key: string) => {
    return {
      key,
      value: envsWithValues[key] || '',
      source: Blocknote.SourceEnv.GLOBAL,
    }
  })
  const uniqueNames: Record<string, number> = {}
  notebook.content = blocks
    .sort((blockA, blockB) => compareDateTimeStrings(blockA.attrs?.timestamp || '', blockB.attrs?.timestamp || ''))
    .map((block) => {
      if (!block.attrs?._globalName) return block
      if (!uniqueNames[block.attrs._globalName]) {
        uniqueNames[block.attrs._globalName] = 1
      } else {
        ++uniqueNames[block.attrs._globalName]
        block.attrs._globalName = `${block.attrs._globalName}_${uniqueNames[block.attrs._globalName]} `
      }
      return block
    })
  const defaultProjectBranch = await ProjectBranchModel.getDefaultProjectBranch(debugSession.project)

  if (!defaultProjectBranch) {
    throw new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND)
  }

  return createEntityWithFirstAvailableName(cookie, {
    workspaceId: debugSession.workspace,
    projectId: debugSession.project,
    branchId: defaultProjectBranch._id.toString(),
  }, {
    key: `${debugSession.name}`,
    type: EntityType.NOTEBOOK,
    archived: false,
    initialState: notebook,
  })
}

async function createEntityWithFirstAvailableName(cookie, params, payload, retry = 0) {
  const versionService = new VersionService(cookie)

  try {
    const entity = await versionService.createEntity({
      ...params,
      payload: { ...payload, key: payload.key + (retry? ` ${retry+1}`: '') } })
    return entity
  } catch (err: any) {
    if (err.statusCode === 409) {
      if (retry > 10) {
        return versionService.createEntity({
          ...params,
          payload: { ...payload, key: payload.key + Date.now() },
        })
      }
      return createEntityWithFirstAvailableName(cookie, params, payload, retry+1)
    }
    throw err
  }
}

async function generateAiDescriptions(debugSession, traces: any) {
  try {
    const aiResp = await openai.chat.completions.create({
      temperature: 0.1,
      model: DEFAULT_MODEL_NAME,
      response_format: { type: 'json_object' },
      max_tokens: 2500,
      stream: false,
      messages: [{
        role: 'system',
        content: 'Given session information with opentelemetry traces tree, return summary for the session and describe user actions or what happens in each top trace. ' +
        'Return result as json with structure {summary: string, blocks: { timestamp: trace.timestamp, description: string }}',
      },
      {
        role: 'user',
        content: JSON.stringify({
          session: debugSession,
          traces,
        }),
      }],
    })
    const jsonString = aiResp.choices?.[0]?.message?.content
    const data = JSON.parse(jsonString || '{}')
    return data
  } catch (err) {
    return {}
  }
}

function getParsed(str: string | undefined, defaultValue: any) {
  if (!str) {
    return defaultValue
  }
  try {
    return JSON.parse(str)
  } catch (err) {
    return defaultValue
  }
}

export function parseAuthQueryParam(authParam: string | undefined): {
  type: string,
  name: string,
  in: 'header' | 'query' | 'cookie',
  value: string
}[] {
  if (!authParam) {
    return []
  }

  // Handle simple authentication type strings
  switch (authParam) {
    case Notebook.AuthSchemaType.BEARER:
      return [{
        type: 'bearer',
        name: 'Authorization',
        in: 'header',
        value: 'BEARER_TOKEN',
      }]
    case Notebook.AuthSchemaType.BASIC:
      return [{
        type: 'basic',
        name: 'Authorization',
        in: 'header',
        value: 'BASIC_AUTH',
      }]
    case Notebook.AuthSchemaType.API_KEY:
      return [{
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        value: 'API_KEY',
      }]
    case Notebook.AuthSchemaType.COOKIE:
      return [{
        type: 'cookie',
        name: 'Cookie',
        in: 'cookie',
        value: 'COOKIE_AUTH',
      }]
    default:
      return []
  }
}

export const buildTraceTree = (
  traces: IDebugSessionNode<ITraceData>[],
): IDebugSessionNode<ITraceData>[] => {
  const traceMap: { [key: string]: IDebugSessionNode<ITraceData> } = {}

  traces.forEach((node) => {
    traceMap[node.meta.SpanId] = { ...node, childSpans: [] }
  })

  const tree: IDebugSessionNode<ITraceData>[] = []

  traces.forEach((node) => {
    const { SpanId, ParentSpanId } = node.meta
    const currentNode = traceMap[SpanId]

    if (ParentSpanId) {
      const parent = traceMap[ParentSpanId]
      if (parent) {
        parent.childSpans?.push(currentNode)
      } else {
        traceMap[ParentSpanId] = generateEmptyParent(ParentSpanId, currentNode)
        tree.push(traceMap[ParentSpanId])
      }
    } else {
      tree.push(currentNode)
    }
  })

  return tree
}

const generateEmptyParent = (
  spanId: string,
  firstChildNode: IDebugSessionNode<ITraceData>,
): IDebugSessionNode<any> => ({
  timestamp: firstChildNode.timestamp,
  type: DebugSessionNodeType.Trace,
  meta: {
    SpanName: 'Missing Span',
    ServiceName: 'Missing Span',
    ScopeName: firstChildNode.meta.ScopeName,
    SpanId: spanId,
    SpanAttributes: null,
    ResourceAttributes: {},
    Duration: -1,
  },
  childSpans: [firstChildNode],
  id: '',
  duration: -1,
})


export function newDebugSessionNode<T>(
  type: DebugSessionNodeType,
  meta: any,
): IDebugSessionNode<T> {
  let timestamp = 0
  let duration = -1
  const childSpans: any[] = []
  const id = meta.id || ''

  switch (type) {
    case DebugSessionNodeType.Trace:
      timestamp = parseDate(meta.Timestamp)
      duration = Number(meta.Duration)
      break
    case DebugSessionNodeType.Event:
      timestamp = parseDate(meta.Timestamp)
      break
    case DebugSessionNodeType.Console:
      timestamp = meta.timestamp
      break
    case DebugSessionNodeType.Log:
      timestamp = parseDate(meta.Timestamp)
      break
    default:
      break
  }

  return { id, type, meta, timestamp, childSpans, duration }
}


export function parseDate(dateStr: any): number {
  if (!dateStr) return Date.now()
  // Handle format: 2024-07-25 11:42:37.622000000
  if (dateStr.includes(' ')) {
    return new Date(dateStr.replace(' ', 'T') + 'Z').getTime()
  }
  // Handle format: 2024-07-25T11:42:07.777Z
  return new Date(dateStr).getTime()
}


export function minimizeNodeData(node: IDebugSessionNode<any>): any {
  if (node.type === DebugSessionNodeType.Log) {
    return {
      type: node.type,
      timestamp: node.timestamp,
      SpanName: node.meta.SpanName,
      SpanKind: node.meta.SpanKind,
      ServiceName: node.meta.ServiceName,
      LogAttributes: node.meta.LogAttributes,
    }
  }
  if (node.type === DebugSessionNodeType.Event) {
    return {
      type: node.type,
      timestamp: node.timestamp,
      SpanName: node.meta.SpanName,
      SpanKind: node.meta.SpanKind,
      ServiceName: node.meta.ServiceName,
      SpanAttributes: node.meta.SpanAttributes,
    }
  }
  if (node.type === DebugSessionNodeType.Trace) {
    return {
      type: node.type,
      timestamp: node.timestamp,
      SpanName: node.meta.SpanName,
      SpanKind: node.meta.SpanKind,
      ServiceName: node.meta.ServiceName,
      SpanAttributes: node.meta.SpanAttributes,
      childSpans: (node.childSpans || []).map((child) => minimizeNodeData(child)),
    }
  }
  return node
}
