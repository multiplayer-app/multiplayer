// Links that open a trace - or its logs - in a project's own observability tools (Grafana Tempo and
// Loki, Jaeger, ...), built from the project's trace link settings. Shared by the web app and the
// alert notifications so both produce the same URLs.
//
// Grafana links are stored as their parts (URL, datasource, query) and built here, not stored as
// URLs: an Explore URL is JSON inside a query string, so substituted values must be JSON- and
// URL-encoded in order - and a change of Grafana's URL format is a change here, not a migration.

import slugifyString from './slugify-string'

// The values of TraceLinkType in @multiplayer/types
const GRAFANA_TEMPO = 'GRAFANA_TEMPO'
const GRAFANA_LOKI = 'GRAFANA_LOKI'
const CUSTOM = 'CUSTOM'

export interface TraceLinkConfig {
  type: string
  name: string
  // Environments whose spans the link is for (e.g. a Grafana per environment); none means all
  environments?: string[]
  // Grafana: base URL (may include a sub path), datasource UID and optional organization id
  url?: string
  datasourceUid?: string
  orgId?: number
  // Grafana Loki: LogQL query with placeholders
  query?: string
  // Custom: URL with placeholders
  urlTemplate?: string
}

export interface TraceLinkTarget {
  traceId: string
  spanId?: string
  serviceName?: string
  environment?: string
  // When the span started: a Date, epoch seconds/ms/µs/ns, an ISO string, or the analytics
  // store's 'YYYY-MM-DD HH:MM:SS[.fff]' (UTC)
  timestamp?: string | number | Date
}

export interface TraceLink {
  name: string
  url: string
}

export const TRACE_LINK_PLACEHOLDERS = ['traceId', 'spanId', 'serviceName', 'environment', 'from', 'to'] as const

type Placeholder = typeof TRACE_LINK_PLACEHOLDERS[number]

// Logs of the span's service that belong to the trace. `service_name` is the label Loki gives
// OTLP-ingested logs, and `trace_id` their structured metadata.
export const DEFAULT_LOKI_TRACE_QUERY = '{service_name="{serviceName}"} | trace_id="{traceId}"'

// Grafana needs a time range; the trace almost certainly lies within an hour of its span
const TIME_RANGE_MARGIN_MS = 60 * 60 * 1000

const PLACEHOLDER_PATTERN = new RegExp(`\\{(${TRACE_LINK_PLACEHOLDERS.join('|')})\\}`, 'g')
const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/i
const DATASOURCE_UID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/
const STORE_TIMESTAMP_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(\.\d+)?$/

// Used to validate link settings, which must produce a link for any trace
const SAMPLE_TARGET: TraceLinkTarget = {
  traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
  spanId: '00f067aa0ba902b7',
  serviceName: 'checkout',
  environment: 'production',
  timestamp: 1767225600000,
}

const toEpochMs = (timestamp?: string | number | Date): number | undefined => {
  if (timestamp === undefined || timestamp === null || timestamp === '') {
    return undefined
  }

  if (timestamp instanceof Date) {
    return isNaN(timestamp.getTime()) ? undefined : timestamp.getTime()
  }

  if (typeof timestamp === 'number') {
    if (!Number.isFinite(timestamp)) return undefined
    if (timestamp > 1e17) return Math.floor(timestamp / 1e6) // nanoseconds
    if (timestamp > 1e14) return Math.floor(timestamp / 1e3) // microseconds
    if (timestamp < 1e11) return timestamp * 1000 // seconds
    return timestamp
  }

  const storeTimestamp = STORE_TIMESTAMP_PATTERN.exec(timestamp)
  const ms = storeTimestamp
    ? Date.parse(`${storeTimestamp[1]}T${storeTimestamp[2]}${(storeTimestamp[3] || '').slice(0, 4)}Z`)
    : Date.parse(timestamp)

  return isNaN(ms) ? undefined : ms
}

const parseHttpUrl = (value?: string): URL | undefined => {
  if (!value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined
  } catch {
    return undefined
  }
}

const getPlaceholderValues = (target: TraceLinkTarget): Record<Placeholder, string> => {
  const start = toEpochMs(target.timestamp) ?? Date.now()

  return {
    traceId: target.traceId.toLowerCase(),
    spanId: target.spanId || '',
    serviceName: target.serviceName || '',
    environment: target.environment || '',
    from: String(start - TIME_RANGE_MARGIN_MS),
    to: String(start + TIME_RANGE_MARGIN_MS),
  }
}

const fillPlaceholders = (
  template: string,
  values: Record<Placeholder, string>,
  escape: (value: string) => string,
) => template.replace(PLACEHOLDER_PATTERN, (_, name: Placeholder) => escape(values[name]))

// Inside a double-quoted LogQL string
const escapeLogqlString = (value: string) => value.replace(/[\\"]/g, '\\$&')

// Whether `template` uses a placeholder that has no value for this target
const usesEmptyPlaceholder = (template: string, values: Record<Placeholder, string>) => {
  const used = template.match(PLACEHOLDER_PATTERN) || []
  return used.some(placeholder => !values[placeholder.slice(1, -1) as Placeholder])
}

const buildGrafanaExploreUrl = (
  link: TraceLinkConfig,
  query: Record<string, unknown>,
  values: Record<Placeholder, string>,
): string | undefined => {
  const base = parseHttpUrl(link.url)

  if (!base || !link.datasourceUid || !DATASOURCE_UID_PATTERN.test(link.datasourceUid)) {
    return undefined
  }

  const panes = {
    mp: {
      datasource: link.datasourceUid,
      queries: [{ refId: 'A', ...query }],
      range: { from: values.from, to: values.to },
    },
  }
  const orgId = Number.isInteger(link.orgId) && (link.orgId as number) > 0 ? `&orgId=${link.orgId}` : ''

  // encodeURIComponent, not URLSearchParams: Grafana does not read `+` as a space
  return `${base.origin}${base.pathname.replace(/\/+$/, '')}/explore?schemaVersion=1`
    + `&panes=${encodeURIComponent(JSON.stringify(panes))}${orgId}`
}

/**
 * The URL that opens `target` with `link`, or undefined when the link cannot be built - an invalid
 * trace id or link, or anything but an http(s) URL as the result.
 */
export const buildTraceLinkUrl = (link: TraceLinkConfig, target: TraceLinkTarget): string | undefined => {
  if (!link || !target?.traceId || !TRACE_ID_PATTERN.test(target.traceId)) {
    return undefined
  }

  const values = getPlaceholderValues(target)

  switch (link.type) {
    case GRAFANA_TEMPO:
      return buildGrafanaExploreUrl(link, {
        datasource: { type: 'tempo', uid: link.datasourceUid },
        // A TraceQL query that is a trace id looks the trace up
        queryType: 'traceql',
        query: values.traceId,
        limit: 20,
        tableType: 'traces',
      }, values)

    case GRAFANA_LOKI: {
      const query = link.query || DEFAULT_LOKI_TRACE_QUERY

      // An empty value leaves a matcher like `service_name=""`, which Loki rejects
      if (usesEmptyPlaceholder(query, values)) return undefined

      return buildGrafanaExploreUrl(link, {
        datasource: { type: 'loki', uid: link.datasourceUid },
        editorMode: 'code',
        queryType: 'range',
        expr: fillPlaceholders(query, values, escapeLogqlString),
      }, values)
    }

    case CUSTOM: {
      if (!link.urlTemplate) return undefined

      const url = fillPlaceholders(link.urlTemplate, values, encodeURIComponent)
      return parseHttpUrl(url) ? url : undefined
    }

    default:
      return undefined
  }
}

/**
 * Why a trace link setting is unusable, or undefined when it is valid.
 */
export const getTraceLinkConfigError = (link: TraceLinkConfig): string | undefined => {
  if (![GRAFANA_TEMPO, GRAFANA_LOKI, CUSTOM].includes(link?.type)) {
    return 'unknown trace link type'
  }

  if (link.type === CUSTOM) {
    if (!link.urlTemplate?.includes('{traceId}')) {
      return 'the URL template must contain {traceId}'
    }
  } else {
    if (!parseHttpUrl(link.url)) {
      return 'the Grafana URL must be an http(s) URL'
    }
    if (!link.datasourceUid || !DATASOURCE_UID_PATTERN.test(link.datasourceUid)) {
      return 'the datasource UID may only contain letters, digits, ".", "_" and "-"'
    }
  }

  return buildTraceLinkUrl(link, SAMPLE_TARGET) ? undefined : 'the link does not produce an http(s) URL'
}

/**
 * The trace and the time of a span as stored by the platform (`TraceId`, `ServiceName`, ...).
 */
export const getTraceLinkTarget = (span?: {
  TraceId?: string
  SpanId?: string
  ServiceName?: string
  Timestamp?: string | number | Date
  ResourceAttributes?: Record<string, any>
}): TraceLinkTarget | undefined => {
  if (!span?.TraceId) {
    return undefined
  }

  const resource = span.ResourceAttributes || {}

  return {
    traceId: span.TraceId,
    spanId: span.SpanId,
    serviceName: span.ServiceName || resource['service.name'],
    environment: resource['deployment.environment.name'] || resource['deployment.environment'],
    timestamp: span.Timestamp,
  }
}

/**
 * Whether `link` is for spans of `environment`. Names are compared as slugs, as alert rule scopes
 * are, so `Production` and `production` are one environment. A span without an environment only
 * gets the links that are for all environments.
 */
export const isTraceLinkForEnvironment = (link: TraceLinkConfig, environment?: string): boolean => {
  const environments = (link.environments || []).filter(Boolean)

  if (!environments.length) {
    return true
  }

  if (!environment) {
    return false
  }

  const environmentSlug = slugifyString(environment)
  return environments.some(name => slugifyString(name) === environmentSlug)
}

/**
 * The links of `links` for `target`'s environment that can be built, in order.
 */
export const buildTraceLinks = (links: TraceLinkConfig[] | undefined, target?: TraceLinkTarget): TraceLink[] => {
  if (!target || !links?.length) {
    return []
  }

  return links
    .filter(link => isTraceLinkForEnvironment(link, target.environment))
    .flatMap((link) => {
      const url = buildTraceLinkUrl(link, target)
      return url ? [{ name: link.name, url }] : []
    })
}
