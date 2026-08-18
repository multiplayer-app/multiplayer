import type { OtelSpanCh } from '@multiplayer/types'
import { duckdbStore } from '../src/store/duckdb/duckdb.store'
import * as DebugSessionService from '../src/services/debug-session.service'
import * as ContinuousDebugSessionService from '../src/services/continuous-debug-session.service'

// createDebugSessionSpans/createContinuousDebugSessionSpans used to unconditionally
// run OtlpLib.flattenSpansForClickHouse() before Store.insert() - a ClickHouse-only
// transformation (Events/Links -> Nested-column keys like "Events.Timestamp") that
// DuckDB's schema (a single `Events JSON` column) doesn't understand, throwing
// "Binder Error: Table otel_traces does not have a column with name Events.Timestamp".
// With ANALYTICS_DB_ENGINE=duckdb (the test default), inserting an unflattened span
// must succeed and round-trip Events/Links correctly.

const buildSpan = (overrides: Partial<OtelSpanCh> = {}): OtelSpanCh => ({
  id: 'span-regression-1',
  debugSessionId: 'ds-regression',
  Timestamp: new Date().toISOString(),
  TraceId: 'trace-1',
  SpanId: 'span-1',
  SpanName: 'test-span',
  SpanKind: 1,
  ServiceName: 'test-service',
  ResourceAttributes: {},
  SpanAttributes: {},
  Duration: 100,
  Events: [{ Timestamp: new Date().toISOString(), Name: 'exception', Attributes: { 'exception.message': 'boom' } }],
  Links: [{ TraceId: 'trace-0', SpanId: 'span-0', TraceState: '', Attributes: {} }],
  ...overrides,
} as OtelSpanCh)

beforeAll(async () => {
  await duckdbStore.connect()
})

afterAll(async () => {
  await duckdbStore.disconnect()
})

describe('createDebugSessionSpans: engine-appropriate Events/Links shape', () => {
  it('inserts an unflattened span into DuckDB without throwing, and Events round-trips', async () => {
    await DebugSessionService.createDebugSessionSpans([buildSpan({ debugSessionId: 'ds-regression-manual' })])

    const [row] = await duckdbStore.select('debug_session.otel_traces', { debugSessionId: 'ds-regression-manual' })

    expect(row).toBeDefined()
    const events = typeof row.Events === 'string' ? JSON.parse(row.Events) : row.Events
    expect(events).toEqual([
      expect.objectContaining({ Name: 'exception' }),
    ])
  })

  it('same for continuous debug sessions', async () => {
    await ContinuousDebugSessionService.createContinuousDebugSessionSpans(
      [buildSpan({ debugSessionId: 'ds-regression-continuous' })],
    )

    const [row] = await duckdbStore.select('debug_session.otel_traces', { debugSessionId: 'ds-regression-continuous' })

    expect(row).toBeDefined()
  })
})
