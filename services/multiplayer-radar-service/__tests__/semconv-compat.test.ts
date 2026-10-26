import type { OtelSpanCh } from '@multiplayer/types'
import {
  ATTR_MULTIPLAYER_WORKSPACE_ID,
  ATTR_MULTIPLAYER_PROJECT_ID,
} from '@multiplayer-app/session-recorder-node'
import { OTEL_STATUS_CODE_VALUE_ERROR } from '@opentelemetry/semantic-conventions'
import {
  getAttributeValue,
  getExternalDependencyNameFromSpan,
  getIssueFromSpan,
} from '../src/libs/otlp.lib'
import { extractSequenceFromSpans } from '../src/libs/flows.lib'
import { ESpanKind, type IKeyValue, type ISpan } from '../src/types'

// Each case describes one operation twice: as emitted by pre-stable instrumentations and as
// emitted by current ones (instrumentation-http >= 0.221, contrib instrumentations on SDK 3.x),
// which only send the stable semantic conventions.

type Attributes = Record<string, string | number>

const toKeyValues = (attributes: Attributes): IKeyValue[] => Object.entries(attributes)
  .map(([key, value]) => ({
    key,
    value: typeof value === 'number' ? { intValue: value } : { stringValue: value },
  }))

const buildChSpan = (spanAttributes: Attributes, resourceAttributes: Attributes = {}): OtelSpanCh => ({
  Timestamp: '2026-10-26T10:00:00.000Z',
  TraceId: 'f2a1c3d4e5f60718293a4b5c6d7e8f90',
  SpanId: '1a2b3c4d5e6f7081',
  SpanName: 'POST /v1/items',
  SpanKind: ESpanKind.SPAN_KIND_SERVER,
  ServiceName: 'items-api',
  ResourceAttributes: { 'service.name': 'items-api', 'service.version': '1.4.0', ...resourceAttributes },
  SpanAttributes: {
    [ATTR_MULTIPLAYER_WORKSPACE_ID]: '6491c2e98a1a2213633434bc',
    [ATTR_MULTIPLAYER_PROJECT_ID]: '65109c67d4abb818be2e497d',
    ...spanAttributes,
  },
  Duration: 12,
  StatusCode: OTEL_STATUS_CODE_VALUE_ERROR,
  StatusMessage: 'Request failed',
  Events: [],
  Links: [],
})

const legacyHttp: Attributes = {
  'http.method': 'POST',
  'http.status_code': 502,
  'http.url': 'https://api.example.com/v1/items?limit=10',
  'http.target': '/v1/items?limit=10',
  'http.host': 'api.example.com',
  'http.route': '/v1/items',
}

const stableHttp: Attributes = {
  'http.request.method': 'POST',
  'http.response.status_code': 502,
  'url.full': 'https://api.example.com/v1/items?limit=10',
  'url.scheme': 'https',
  'url.path': '/v1/items',
  'url.query': 'limit=10',
  'server.address': 'api.example.com',
  'server.port': 443,
  'http.route': '/v1/items',
}

describe('Semantic conventions compatibility', () => {
  it('resolves legacy HTTP attributes from stable-only producers', () => {
    const legacy = toKeyValues(legacyHttp)
    const stable = toKeyValues(stableHttp)

    for (const key of ['http.method', 'http.status_code', 'http.url', 'http.target', 'http.host', 'http.route']) {
      expect(getAttributeValue(stable, key)).toEqual(getAttributeValue(legacy, key))
    }
  })

  it('resolves stable HTTP attributes from legacy-only producers', () => {
    const legacy = toKeyValues(legacyHttp)

    expect(getAttributeValue(legacy, 'http.request.method')).toBe('POST')
    expect(getAttributeValue(legacy, 'http.response.status_code')).toBe(502)
    expect(getAttributeValue(legacy, 'url.full')).toBe('https://api.example.com/v1/items?limit=10')
  })

  it('keeps non-default ports and drops default ones in http.host', () => {
    expect(getAttributeValue(toKeyValues({ 'server.address': 'api.local', 'server.port': 8080, 'url.scheme': 'http' }), 'http.host'))
      .toBe('api.local:8080')
    expect(getAttributeValue(toKeyValues({ 'server.address': 'api.local', 'server.port': 80, 'url.scheme': 'http' }), 'http.host'))
      .toBe('api.local')
    expect(getAttributeValue(toKeyValues({ 'server.address': 'api.local', 'server.port': 443 }), 'http.host'))
      .toBe('api.local')
  })

  it('resolves the original verb of non-standard HTTP methods', () => {
    const stable = toKeyValues({ 'http.request.method': '_OTHER', 'http.request.method_original': 'PURGE' })

    expect(getAttributeValue(stable, 'http.method')).toBe('PURGE')
  })

  it('prefers the attribute the producer actually sent', () => {
    const duplicated = toKeyValues({ 'http.method': 'GET', 'http.request.method': 'POST' })

    expect(getAttributeValue(duplicated, 'http.method')).toBe('GET')
    expect(getAttributeValue(duplicated, 'http.request.method')).toBe('POST')
  })

  it('names database dependencies identically across db.system renames', () => {
    const cases: [Attributes, Attributes, string][] = [
      [{ 'db.system': 'mssql' }, { 'db.system.name': 'microsoft.sql_server' }, 'mssql'],
      [{ 'db.system': 'postgresql' }, { 'db.system.name': 'postgresql' }, 'postgresql'],
      [{ 'db.system': 'dynamodb' }, { 'db.system.name': 'aws.dynamodb' }, 'dynamodb'],
    ]

    for (const [legacy, stable, expected] of cases) {
      expect(getExternalDependencyNameFromSpan(buildChSpan(legacy))).toBe(expected)
      expect(getExternalDependencyNameFromSpan(buildChSpan(stable))).toBe(expected)
      expect(getExternalDependencyNameFromSpan({
        kind: ESpanKind.SPAN_KIND_CLIENT,
        attributes: toKeyValues(stable),
      } as ISpan)).toBe(expected)
    }
  })

  it('splits fully qualified rpc.method into the legacy rpc.service/rpc.method pair', () => {
    const legacy = toKeyValues({ 'rpc.system': 'grpc', 'rpc.service': 'shop.Cart', 'rpc.method': 'AddItem' })
    const stable = toKeyValues({ 'rpc.system.name': 'grpc', 'rpc.method': 'shop.Cart/AddItem' })

    for (const key of ['rpc.system', 'rpc.service', 'rpc.method']) {
      expect(getAttributeValue(stable, key)).toEqual(getAttributeValue(legacy, key))
    }
  })

  it('resolves messaging.destination from messaging.destination.name', () => {
    const stable = toKeyValues({ 'messaging.system': 'rabbitmq', 'messaging.destination.name': 'orders' })

    expect(getAttributeValue(stable, 'messaging.destination')).toBe('orders')
  })

  it('groups the same error into the same issue regardless of semconv version', () => {
    const legacyIssue = getIssueFromSpan(buildChSpan(legacyHttp, { 'deployment.environment': 'production' }))
    const stableIssue = getIssueFromSpan(buildChSpan(stableHttp, { 'deployment.environment.name': 'production' }))

    expect(legacyIssue?.metadata.httpMethod).toBe('POST')
    expect(legacyIssue?.service.environment).toBe('production')
    expect(stableIssue?.metadata).toEqual(legacyIssue?.metadata)
    expect(stableIssue?.service).toEqual(legacyIssue?.service)
    expect(stableIssue?.hash).toBe(legacyIssue?.hash)
    expect(stableIssue?.componentHash).toBe(legacyIssue?.componentHash)
    expect(stableIssue?.titleHash).toBe(legacyIssue?.titleHash)
  })

  it('extracts the same flow sequence regardless of semconv version', () => {
    const legacyFlow = extractSequenceFromSpans([buildChSpan(legacyHttp, { 'deployment.environment': 'production' })])
    const stableFlow = extractSequenceFromSpans([buildChSpan(stableHttp, { 'deployment.environment.name': 'production' })])

    expect(legacyFlow?.environmentName).toBe('production')
    expect(legacyFlow?.sequence[0]).toMatchObject({ httpHost: 'api.example.com', httpMethod: 'POST', httpStatus: 502 })
    expect(stableFlow?.environmentName).toBe(legacyFlow?.environmentName)
    expect(stableFlow?.sequence).toEqual(legacyFlow?.sequence)
  })
})
