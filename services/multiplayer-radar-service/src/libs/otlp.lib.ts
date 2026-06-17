import { slugifyString } from '@multiplayer/util-shared'
import {
  ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY_ENCODING,
  ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY,
  SessionRecorderSdk,
  MULTIPLAYER_TRACE_DOC_PREFIX,
  ATTR_MULTIPLAYER_SESSION_ID,
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
  ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH,
  SessionType,
  MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX,
  MULTIPLAYER_TRACE_SESSION_PREFIX,
  MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX,
  MULTIPLAYER_TRACE_DEBUG_PREFIX,
} from '@multiplayer-app/session-recorder-node'
import logger from '@multiplayer/logger'
import { ObjectId } from '@multiplayer/mongo'
import {
  OtelSpanCh,
  OtelLogCh,
  IIssue,
  IssueCategoryEnum,
} from '@multiplayer/types'
import { createHash } from 'crypto'
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMATTRS_DB_SYSTEM,
  SEMATTRS_RPC_SYSTEM,
  SEMATTRS_RPC_SERVICE,
  SEMATTRS_MESSAGING_SYSTEM,
  OTEL_STATUS_CODE_VALUE_ERROR,
  OTEL_STATUS_CODE_VALUE_OK,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_ROUTE,
  SEMATTRS_HTTP_URL,
  SEMATTRS_HTTP_TARGET,
} from '@opentelemetry/semantic-conventions'
import {
  type IExportTraceServiceRequest,
  type IExportLogsServiceRequest,
  type ISpan,
  ESpanKind,
  type IKeyValue,
  type IEvent,
  type ILink,
} from '../types'
import { uncompressHexString } from '../helpers'

const sanitizeStacktraceFilenames = (stack?: string): string => {
  if (!stack) return ''
  const filenameRegex = /([A-Za-z]:)?[^:\s)]+[\\/]+([^:\s)]+)(:\d+(?::\d+)?)?/g
  return String(stack).split('\n').map(line => line.replace(filenameRegex, '$2$3')).join('\n')
}

export const getAttributeValue = (
  attributes: IKeyValue[] | undefined,
  attributeName,
): string | number | boolean | Uint8Array | undefined => {
  if (!attributes) {
    return undefined
  }

  const attribute = attributes.find(({ key }) => key === attributeName)

  if (!attribute) {
    return undefined
  }

  const valueKey = Object.keys(attribute.value)[0]


  return attribute?.value?.[valueKey]
}

const traceIDToHexOrEmptyString = (id: string | Uint8Array): string => {
  if (!id) {
    return ''
  }
  return id.toString()
}

const spanIDToHexOrEmptyString = (id: string | Uint8Array): string => {
  if (!id) {
    return ''
  }
  return id.toString()
}

const convertLinks = (links: ILink[] | undefined): OtelSpanCh['Links'] => {
  if (!links?.length) {
    return []
  }

  return links.map(link => ({
    TraceId: traceIDToHexOrEmptyString(link.traceId),
    SpanId: spanIDToHexOrEmptyString(link.spanId),
    TraceState: link.traceState || '',
    Attributes: attributesToMap(link.attributes),
  }))
}

const statusCodeStr = (status: number): string => {
  switch (status) {
    case 0:
      return 'UNSET'
    case 1:
      return OTEL_STATUS_CODE_VALUE_OK
    case 2:
      return OTEL_STATUS_CODE_VALUE_ERROR
  }
  return 'UNSET'
}

export const getExternalDependencyNameFromSpan = (
  span: OtelSpanCh | ISpan,
): string | undefined => {
  if (
    (span as ISpan).kind
    && (span as ISpan).kind !== ESpanKind.SPAN_KIND_CLIENT
  ) {
    return undefined
  }

  if ((span as OtelSpanCh).SpanAttributes) {
    const dbSystem = (span as OtelSpanCh).SpanAttributes[SEMATTRS_DB_SYSTEM]

    if (dbSystem) {
      return slugifyString((dbSystem as string).trim().toLowerCase())
    }

    const rpcSystem = (span as OtelSpanCh).SpanAttributes[SEMATTRS_RPC_SYSTEM]
    const rpcService = (span as OtelSpanCh).SpanAttributes[SEMATTRS_RPC_SERVICE]

    if (rpcSystem || rpcService) {
      return slugifyString(`${rpcSystem}-${rpcService}`.trim().toLowerCase())
    }

    const messagingSystem = (span as OtelSpanCh).SpanAttributes[SEMATTRS_MESSAGING_SYSTEM]

    if (messagingSystem) {
      return slugifyString((messagingSystem as string).trim().toLowerCase())
    }
  } else if ((span as ISpan).attributes) {
    const dbSystem = getAttributeValue(
      (span as ISpan).attributes,
      SEMATTRS_DB_SYSTEM,
    )

    if (dbSystem) {
      return slugifyString((dbSystem as string).trim().toLowerCase())
    }

    const rpcSystem = getAttributeValue(
      (span as ISpan)?.attributes,
      SEMATTRS_RPC_SYSTEM,
    )
    const rpcService = getAttributeValue(
      (span as ISpan).attributes,
      SEMATTRS_RPC_SERVICE,
    )

    if (rpcSystem || rpcService) {
      return slugifyString(`${rpcSystem}-${rpcService}`.trim().toLowerCase())
    }

    const messagingSystem = getAttributeValue(
      (span as ISpan).attributes,
      SEMATTRS_MESSAGING_SYSTEM,
    ) as string | undefined

    if (messagingSystem) {
      return slugifyString(messagingSystem.trim().toLowerCase())
    }
  }

  return undefined
}

export const getExternalDependencyNameFromName = (name: string): string | undefined => {
  if (!name) {
    return undefined
  }

  const externalDependencies = [
    'mysql',
    'mongo',
    'mongodb',
    'rabbitmq',
    'kafka',
    'redis',
  ]

  const formattedName = name.toLowerCase()
  const externalDependencyName = externalDependencies.find(dependencyName => {
    return formattedName.includes(dependencyName.toLowerCase())
  })

  return externalDependencyName?.toLowerCase()
}

const SHARED_CHAR_CODES_ARRAY = Array(32)
export const getIdGenerator = (bytes) => {
  return function generateId() {
    for (let i = 0; i < bytes * 2; i++) {
      SHARED_CHAR_CODES_ARRAY[i] = Math.floor(Math.random() * 16) + 48
      // valid hex characters in the range 48-57 and 97-102
      if (SHARED_CHAR_CODES_ARRAY[i] >= 58) {
        SHARED_CHAR_CODES_ARRAY[i] += 39
      }
    }
    return String.fromCharCode.apply(
      null,
      SHARED_CHAR_CODES_ARRAY.slice(0, bytes * 2),
    )
  }
}

const attributesToMap = (attributes: IKeyValue[] | undefined): object => {
  if (!attributes?.length) {
    return {}
  }

  const _attributes = {}

  for (const attributeObject of attributes) {
    const key = attributeObject.key
    const valueKey = Object.keys(attributeObject.value)[0]
    const value = attributeObject.value[valueKey]

    _attributes[key] = value
  }

  return _attributes
}

const convertEvents = (events: IEvent[] | undefined): OtelSpanCh['Events'] => {
  if (!events) {
    return []
  }

  return events.map(event => {

    let _attributes = attributesToMap(event.attributes)

    if (Object.keys(_attributes).length === 0) {
      _attributes = (event as any)?.attributes
    }

    return {
      Timestamp: event.timeUnixNano
        ? new Date(Number(event.timeUnixNano) / 1000000).toISOString()
        : new Date((event as any).time[0] * 1000 + (event as any).time[1] / 1000000).toISOString(),
      Name: event.name,
      Attributes: _attributes,
    }
  })
}

export const convertExportTraceToCh = (serviceTraceRequest: IExportTraceServiceRequest): OtelSpanCh[] => {
  const convertedSpans: OtelSpanCh[] = []

  try {
    for (const resourceSpan of (serviceTraceRequest?.resourceSpans || [])) {
      const resourceAttributes = attributesToMap(resourceSpan.resource?.attributes)

      for (const scopeSpan of resourceSpan.scopeSpans) {
        for (const span of (scopeSpan.spans || [])) {
          let spanAttributes = attributesToMap(span.attributes)
          let resourceAttributesFromSpan

          if (Object.keys(resourceAttributes).length === 0) {
            resourceAttributesFromSpan = (span as any)?.resource?.attributes
          }

          if (Object.keys(spanAttributes).length === 0) {
            spanAttributes = span.attributes
          }

          const events = convertEvents(span.events)
          const links = convertLinks(span.links)

          const startTime = span.startTimeUnixNano
            ? new Date(Number(span.startTimeUnixNano) / 1000000).toISOString()
            : new Date((span as any).startTime[0] * 1000 + (span as any).startTime[1] / 1000000).toISOString()
          const endTime = span.endTimeUnixNano
            ? new Date(Number(span.endTimeUnixNano) / 1000000).toISOString()
            : new Date((span as any).endTime[0] * 1000 + (span as any).endTime[1] / 1000000).toISOString()

          const _resourceAttributes = Object.keys(resourceAttributes).length > 0
            ? resourceAttributes
            : resourceAttributesFromSpan

          const chSpan: OtelSpanCh = {
            id: new ObjectId().toString(),
            Timestamp: startTime,
            TraceId: traceIDToHexOrEmptyString(span.traceId),
            SpanId: spanIDToHexOrEmptyString(span.spanId),
            ...span.parentSpanId
              ? { ParentSpanId: spanIDToHexOrEmptyString(span.parentSpanId) }
              : {},
            ...span.traceState
              ? { TraceState: span.traceState }
              : {},
            SpanName: span.name,
            SpanKind: span.kind,
            ServiceName: resourceAttributes[SEMRESATTRS_SERVICE_NAME] || spanAttributes[SEMRESATTRS_SERVICE_NAME] || '',
            ResourceAttributes: _resourceAttributes,
            ScopeName: scopeSpan.scope?.name,
            ScopeVersion: scopeSpan.scope?.version,
            SpanAttributes: spanAttributes,
            Duration: Number(new Date(endTime).getTime()) - Number(new Date(startTime).getTime()),
            StatusCode: statusCodeStr(span.status?.code),
            StatusMessage: span.status.message,
            Events: events,
            Links: links,
          }

          convertedSpans.push(chSpan)
        }
      }
    }

    return convertedSpans
  } catch (err) {
    logger.error(err, '[OTEL-CONVERTER] Failed to convert trace from kafka to clickhouse')

    return convertedSpans
  }
}

export const convertExportLogsToCh = (serviceLogRequest: IExportLogsServiceRequest): OtelLogCh[] => {
  const convertedLogs: OtelLogCh[] = []

  try {
    for (const resourceLog of (serviceLogRequest?.resourceLogs || [])) {
      const resourceAttributes = attributesToMap(resourceLog.resource?.attributes)
      const serviceName = resourceAttributes[SEMRESATTRS_SERVICE_NAME]

      if (!serviceName) {
        logger.error('[OTEL-CONVERTER] Failed to get service name for log')
        continue
      }

      for (const scopeLog of resourceLog.scopeLogs) {
        for (const logRecord of (scopeLog.logRecords || [])) {
          const chLog: OtelLogCh = {
            id: new ObjectId().toString(),
            Timestamp: new Date(Number(logRecord.timeUnixNano) / 1000000).toISOString(),
            TraceId: traceIDToHexOrEmptyString(logRecord.traceId as string),
            SpanId: spanIDToHexOrEmptyString(logRecord.spanId as string),
            TraceFlags: logRecord.flags,
            SeverityText: logRecord.severityText,
            SeverityNumber: logRecord.severityNumber,
            ServiceName: serviceName,
            Body: logRecord.body?.stringValue || '',
            ResourceSchemaUrl: resourceLog.schemaUrl,
            ResourceAttributes: resourceAttributes,
            ScopeSchemaUrl: scopeLog.schemaUrl as undefined | string,
            ScopeName: scopeLog.scope?.name,
            ScopeVersion: scopeLog.scope?.version,
            ScopeAttributes: attributesToMap(scopeLog.scope?.attributes),
            LogAttributes: attributesToMap(logRecord?.attributes),
          }

          convertedLogs.push(chLog)
        }
      }
    }

    return convertedLogs
  } catch (err) {
    logger.error(err, '[OTEL-CONVERTER] Failed to convert log from kafka to clickhouse')

    return convertedLogs
  }
}

export const filterSpansByTracePrefix = (
  serviceTraceRequest: IExportTraceServiceRequest,
  traceIdPrefix: string | string[],
): IExportTraceServiceRequest => {
  const traceIdPrefixes = Array.isArray(traceIdPrefix) ? traceIdPrefix : [traceIdPrefix]

  const _serviceTraceRequest = JSON.parse(JSON.stringify(serviceTraceRequest))

  _serviceTraceRequest.resourceSpans = (_serviceTraceRequest.resourceSpans || []).map(resourceSpan => {
    resourceSpan.scopeSpans = resourceSpan.scopeSpans.map(scopeSpan => {
      scopeSpan.spans = (scopeSpan.spans || []).filter(span => traceIdPrefixes.some(prefix => span.traceId.toString().startsWith(prefix)))

      return scopeSpan
    })

    resourceSpan.scopeSpans = resourceSpan.scopeSpans
      .filter(scopeSpan => scopeSpan.spans?.length)

    return resourceSpan
  })

  _serviceTraceRequest.resourceSpans = _serviceTraceRequest.resourceSpans
    .filter(resourceSpans => resourceSpans.scopeSpans.length)

  return _serviceTraceRequest
}

export const filterDebugSessionSpans = (spans: OtelSpanCh[]): OtelSpanCh[] => {
  return spans.filter(span => span?.SpanAttributes?.[ATTR_MULTIPLAYER_SESSION_ID])
}

export const filterDocSpans = (
  serviceTraceRequest: IExportTraceServiceRequest,
): IExportTraceServiceRequest => {
  const _serviceTraceRequest = JSON.parse(JSON.stringify(serviceTraceRequest))

  _serviceTraceRequest.resourceSpans = (_serviceTraceRequest.resourceSpans || []).map(resourceSpan => {
    resourceSpan.scopeSpans = resourceSpan.scopeSpans.map(scopeSpan => {
      scopeSpan.spans = (scopeSpan.spans || []).filter(span => span.traceId.toString().startsWith(MULTIPLAYER_TRACE_DOC_PREFIX))

      return scopeSpan
    })

    resourceSpan.scopeSpans = resourceSpan.scopeSpans
      .filter(scopeSpan => scopeSpan.spans?.length)

    return resourceSpan
  })

  _serviceTraceRequest.resourceSpans = _serviceTraceRequest.resourceSpans
    .filter(resourceSpans => resourceSpans.scopeSpans.length)


  return _serviceTraceRequest
}

export const uncompressGzipPayloadInSpan = async (spans: OtelSpanCh[]): Promise<OtelSpanCh[]> => {
  for (const span of spans) {
    if (span.SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY_ENCODING] === 'gzip') {
      const uncompressedBuffer = await uncompressHexString(
        span.SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY],
      )

      span.SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY_ENCODING]
        = uncompressedBuffer.toString('utf-8')
    }
  }

  return spans
}

export const maskResponsePayload = (spans: OtelSpanCh[]): OtelSpanCh[] => {
  for (const span of spans) {
    if (span.SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY]) {
      span.SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY]
        = SessionRecorderSdk.mask(span.SpanAttributes[ATTR_MULTIPLAYER_HTTP_RESPONSE_BODY])
    }
  }

  return spans
}


export const isErrorSpan = (span: OtelSpanCh): boolean => {
  return span.StatusCode === OTEL_STATUS_CODE_VALUE_ERROR
}

export const normalizeString = (title: string): string => {
  try {
    if (!title) return ''

    let normalized = title

    normalized = normalized.replace(
      /\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(https?:\/\/[^\s)]+|\/[^\s)]+)/g,
      (match) => {
        const [method, path] = match.split(/\s+/)
        return `${method} ${normalizeHttpEndpoint(path)}`
      },
    )

    if (/^(\/[^\s)]+|[A-Za-z0-9.-]+:\d+\/[^\s)]+)$/.test(normalized)) {
      normalized = normalizeHttpEndpoint(normalized)
    }

    const urls: string[] = []
    normalized = normalized.replace(
      /(https?:\/\/[^\s)]+)/gi,
      (url) => normalizeHttpEndpoint(url) as string,
    )

    // Replace UUIDs (standard format: 8-4-4-4-12 hex chars)
    normalized = normalized.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '{uuid}')

    // Replace MongoDB ObjectIDs (24 hex chars)
    normalized = normalized.replace(/\b[0-9a-f]{24}\b/gi, '{mongoId}')

    // Replace Stripe IDs (prefix_alphanumeric format)
    // Common prefixes: cus_, ch_, sub_, pi_, pm_, in_, src_, card_, ba_, acct_, etc.
    normalized = normalized.replace(/\b[a-z]{2,5}_[A-Za-z0-9]{14,}/g, '{stripeId}')

    // Replace email addresses
    normalized = normalized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '{email}')

    // Replace IPv6 addresses (simplified pattern)
    // Use negative lookbehind to avoid matching line:column numbers in stack traces (e.g., file.js:12:34)
    normalized = normalized.replace(/(?<![.\w])(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}\b/gi, '{ipV6}')

    // Replace IPv4 addresses
    normalized = normalized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '{ipV4}')

    // Replace ISO 8601 timestamps
    normalized = normalized.replace(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?\b/g, '{timestamp}')

    // Replace Unix timestamps (10 or 13 digits)
    normalized = normalized.replace(/\b\d{10}(?:\d{3})?\b/g, '{timestamp}')

    // Replace JWT tokens (header.payload.signature format, base64-like)
    normalized = normalized.replace(/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '{jwt}')

    // Replace generic long hex strings (16+ chars) that weren't caught above
    normalized = normalized.replace(/\b[0-9a-f]{16,}\b/gi, '{hexId}')

    // Replace semantic version numbers before numId so digits in x.y.z aren't consumed first
    normalized = normalized.replace(/\b\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?\b/g, '{version}')

    // Replace negative integers before numId so -1 -> {numId} not -{numId}
    normalized = normalized.replace(/(?<![.\w])-\d+\b/g, '{numId}')

    // Replace all standalone positive integers
    normalized = normalized.replace(/\b\d+\b/g, '{numId}')

    // Finally, replace remaining non-alphanumeric chars with dashes and lowercase
    // normalized = normalized.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()

    // // Clean up multiple consecutive dashes and trim
    // normalized = normalized.replace(/-+/g, '-').replace(/^-+|-+$/g, '')


    normalized = normalized.replace(/https?:\/\/[^\s)]+/gi, (url) => {
      const index = urls.length
      urls.push(url)
      return `__URL_${index}__`
    })

    normalized = normalized.replace(/\b(?=[A-Za-z0-9:_@.-]{16,}\b)(?=[A-Za-z0-9:_@.-]*[A-Z])(?=[A-Za-z0-9:_@.-]*[a-z])(?=[A-Za-z0-9:_@.-]*\d)[A-Za-z0-9:_@.-]+\b/g, (s) => {
      if (s.includes('{') || s.includes('}')) return s
      if (/^[_a-zA-Z]\w*(?:\.[_a-zA-Z]\w*)+$/.test(s)) return s
      return '{id}'
    })

    normalized = normalized.replace(/__URL_(\d+)__/g, (_, i) => urls[i])

    return normalized
  } catch (error) {
    logger.error(error, `[OTEL-LIB] Failed to normalize string: ${title}`)
    throw error
  }
}

const normalizeHttpPathSegment = (segment, index = -1) => {
  if (!segment) {
    return segment
  }

  try {
    segment = decodeURIComponent(segment)

    if (/^[0-9a-f-]{36}$/i.test(segment)) {
      return '{uuid}'
    }

    if (
      index === 1
      && /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(segment)
    ) {
      return segment
    }

    const file = segment.match(/^(.+)\.([A-Za-z0-9]+)$/)
    if (file) {
      return `{id}.${file[2]}`
    }

    if (/^[A-Za-z0-9:%@._-]{15,}$/.test(segment) && /[:@]/.test(segment)) {
      return '{id}'
    }

    if (
      segment.length >= 10 &&
      /[A-Z]/.test(segment) &&
      /[a-z]/.test(segment) &&
      /\d/.test(segment)
    ) {
      return '{id}'
    }

    return segment
  } catch (error) {
    return segment
  }
}

export const normalizeHttpEndpoint = (inputUrl: string): string => {
  const base = 'http://dummy'
  const hasScheme = inputUrl.startsWith('http://') || inputUrl.startsWith('https://')
  const isAbsolutePath = inputUrl.startsWith('/')
  const urlToParse = !hasScheme && !isAbsolutePath
    ? `http://${inputUrl}`
    : inputUrl

  const url = new URL(urlToParse, base)

  const params = [...url.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key]) => `${key}={${key}}`)
    .join('&')

  const normalizedPath = url.pathname
    .split('/')
    .map((segment, index) => normalizeHttpPathSegment(segment, index))
    .join('/')

  const normalizedQuery = params ? `?${params}` : ''

  if (!hasScheme) {
    if (isAbsolutePath) {
      return normalizedPath + normalizedQuery
    }
    return `${url.host}${normalizedPath}${normalizedQuery}`
  }

  return `${url.protocol}//${url.host}${normalizedPath}${normalizedQuery}`
}

export const getIssueTitle = (issue: Partial<IIssue>): string => {
  let defaultTitle = ''

  if (
    issue?.metadata?.spanKind
    && [ESpanKind.SPAN_KIND_CLIENT, ESpanKind.SPAN_KIND_PRODUCER].includes(issue?.metadata?.spanKind)
  ) {
    defaultTitle = 'Outgoing'
  } else {
    defaultTitle = 'Incoming'
  }
  defaultTitle += ' request failed'

  if (
    issue?.metadata?.httpMethod
    && (issue?.metadata?.httpTarget || issue?.metadata?.httpUrl || issue?.metadata?.httpRoute)
  ) {
    defaultTitle += ` ${issue.metadata.httpMethod} ${issue.metadata.httpTarget || issue.metadata.httpUrl || issue.metadata.httpRoute}`
  }

  const title = normalizeString(issue.metadata?.message || issue.metadata?.stacktrace || defaultTitle)

  return title
}

export const getIssueFromSpan = (
  span: OtelSpanCh,
): IIssue | undefined => {
  if (!isErrorSpan(span)) {
    return
  }

  const workspaceId = span.SpanAttributes[ATTR_MULTIPLAYER_WORKSPACE_ID]
  const projectId = span.SpanAttributes[ATTR_MULTIPLAYER_PROJECT_ID]

  const serviceVersion = span.ResourceAttributes[SEMRESATTRS_SERVICE_VERSION]
  const environmentName = span.ResourceAttributes[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]

  const httpMethod = span.SpanAttributes[SEMATTRS_HTTP_METHOD]
  const httpRoute = normalizeString(span.SpanAttributes[SEMATTRS_HTTP_ROUTE])
  const httpTarget = normalizeString(span.SpanAttributes[SEMATTRS_HTTP_TARGET])
  const httpUrl = normalizeString(span.SpanAttributes[SEMATTRS_HTTP_URL])
  const customHash = span.SpanAttributes[ATTR_MULTIPLAYER_ISSUE_CUSTOM_HASH]

  const serviceName = span.ServiceName || span?.ResourceAttributes[SEMRESATTRS_SERVICE_NAME] || span?.SpanAttributes[SEMRESATTRS_SERVICE_NAME] || ''
  const serviceNameSlug = slugifyString(serviceName)

  const environmentSlug = environmentName?.length
    ? slugifyString(environmentName)
    : undefined

  const errorEvent = (
    span['Events.Attributes']?.[0]
    || span?.Events[0]?.Attributes
  )

  const errorMessage = span?.SpanAttributes?.[Object.keys(span?.SpanAttributes).find(key => key.includes('message')) as string]
    || errorEvent?.['exception.message']
    || span.StatusMessage
  const errorStackTrace = errorEvent?.['exception.stacktrace']
  const errorType = errorEvent?.['exception.type']

  const sanitizedStacktrace = sanitizeStacktraceFilenames(errorStackTrace as string | undefined)
  const metadata = {
    spanKind: span.SpanKind,
    ...httpMethod && httpRoute ?
      { culprit: `${httpMethod || ''} ${httpRoute || ''}` }
      : {},
    httpTarget,
    httpUrl,
    httpMethod,
    httpRoute,

    stacktrace: normalizeString(errorStackTrace),
    message: normalizeString(errorMessage),
    type: errorType,
  }

  let category: IssueCategoryEnum = IssueCategoryEnum.ERROR

  if (metadata.stacktrace) {
    category = IssueCategoryEnum.EXCEPTION
  } else if (
    metadata.httpMethod
    || metadata.httpTarget
    || metadata.httpUrl
    || metadata.httpRoute
  ) {
    category = IssueCategoryEnum.HTTP_CLIENT
  } else if (Object.keys(span?.SpanAttributes).find(key => key.startsWith('db.'))) {
    category = IssueCategoryEnum.DB_QUERY
  }


  const issue: Partial<IIssue> = {
    workspace: workspaceId,
    project: projectId,

    resolved: false,
    archived: false,

    customHash,
    // hash,
    // titleHash,
    // componentHash,
    // title,

    category,

    metadata,

    service: {
      serviceName,
      release: serviceVersion,
      environment: environmentName,

      serviceNameSlug,
      environmentSlug,
    },
  }


  const title = getIssueTitle(issue)

  const baseHashObject = {
    workspaceId,
    projectId,
    category,
    serviceName,
    title,
    type: metadata?.type || '',
    ...(sanitizedStacktrace?.length
      ? { metadata: { stacktrace: normalizeString(sanitizedStacktrace) } }
      : { metadata }
    ),
  }
  const titleHashObject = {
    workspaceId,
    projectId,
    category,
    title,
    type: metadata?.type || '',
  }
  const hashObject = {
    ...baseHashObject,
    environmentName: environmentName || '',
    serviceVersion: serviceVersion || '',
    metadata: {
      ...metadata,
      ...baseHashObject.metadata,
    },
  }

  issue.title = title
  issue.titleHash = createHash('md5').update(JSON.stringify(titleHashObject)).digest('hex')
  issue.componentHash = createHash('md5').update(JSON.stringify(baseHashObject)).digest('hex')
  issue.hash = createHash('md5').update(JSON.stringify(hashObject)).digest('hex')


  return issue as IIssue
}

export const getSessionTypeFromTraceId = (traceId: string): SessionType | undefined => {
  const prefix = traceId.substring(0, 6)

  switch (prefix) {
    case MULTIPLAYER_TRACE_SESSION_CACHE_PREFIX:
      return SessionType.SESSION_CACHE
    case MULTIPLAYER_TRACE_SESSION_PREFIX:
      return SessionType.SESSION
    case MULTIPLAYER_TRACE_CONTINUOUS_DEBUG_PREFIX:
      return SessionType.CONTINUOUS
    case MULTIPLAYER_TRACE_DEBUG_PREFIX:
      return SessionType.MANUAL
    default:
      return undefined
  }
}

export const injectAttributeToLogs = (
  logs: OtelLogCh[],
  attributes: {
    [name: string]: string,
    value: string,
  }[],
): OtelLogCh[] => {
  return logs.map(log => {
    attributes.forEach(({ name, value }) => {
      log.LogAttributes[name] = value

      if (name === ATTR_MULTIPLAYER_SESSION_ID) {
        log.debugSessionId = value
      }
    })
    return log
  })
}

export const flattenSpansForClickHouse = (spans: OtelSpanCh[]) =>
  spans.map(({ Events, Links, ...span }) => ({
    ...span,
    'Events.Timestamp': Events.map(e => e.Timestamp),
    'Events.Name': Events.map(e => e.Name),
    'Events.Attributes': Events.map(e => e.Attributes),
    'Links.TraceId': Links.map(l => l.TraceId),
    'Links.SpanId': Links.map(l => l.SpanId),
    'Links.TraceState': Links.map(l => l.TraceState),
    'Links.Attributes': Links.map(l => l.Attributes),
  }))

export const injectAttributeToSpans = (
  spans: OtelSpanCh[],
  attributes: {
    [name: string]: string,
    value: string,
  }[],
): OtelSpanCh[] => {
  return spans.map(span => {
    attributes.forEach(({ name, value }) => {
      span.SpanAttributes[name] = value

      if (name === ATTR_MULTIPLAYER_SESSION_ID) {
        span.debugSessionId = value
      }
    })
    return span
  })
}
