import type { OtelSpanCh } from '@multiplayer/types'
import { S3_HOST as CONFIGURED_S3_HOST, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '@multiplayer/s3'
import { duckdbStore } from '../src/store/duckdb/duckdb.store'
import { S3_DEBUG_SESSIONS_BUCKET } from '../src/config'

// duckdb.store used to funnel every Store call (insert/select/countTotal/moveDataToS3)
// through one shared module-level DuckDBConnection. DuckDB connections hold mutable
// per-connection state (active prepared statement, session SET values) and aren't
// safe for concurrent use - moveDataToS3's SET s3_* calls in particular are session-
// scoped, so two concurrent moves sharing one connection could clobber each other's
// S3 endpoint/credentials mid-copy. Fixed by giving every top-level call its own
// connection off the shared DuckDBInstance (DuckDB's documented unit of concurrency).
// This exercises the exact concurrency shape real production traffic hits: a burst of
// selects/countTotal (mirroring stopDebugSessionById) racing ongoing inserts and
// several concurrent moveDataToS3 calls (mirroring the S3-move queue's prefetch: 3).

const TABLE = 'debug_session.otel_traces'
// Sourced from config rather than hardcoded - a hardcoded local-only MinIO port here
// previously worked on the author's machine but broke in CI, which runs its own MinIO
// on a different port.
const S3_HOST = `${CONFIGURED_S3_HOST}/${S3_DEBUG_SESSIONS_BUCKET}`

beforeAll(async () => {
  await duckdbStore.connect()
})

afterAll(async () => {
  await duckdbStore.disconnect()
})

const buildSpan = (i: number, debugSessionId: string): OtelSpanCh => ({
  id: `span-${debugSessionId}-${i}`,
  debugSessionId,
  Timestamp: new Date().toISOString(),
  TraceId: `trace-${i}`,
  SpanId: `span-${i}`,
  SpanName: 'concurrent-span',
  SpanKind: 1,
  ServiceName: 'test-service',
  ResourceAttributes: { 'service.name': 'test-service' },
  SpanAttributes: { 'http.method': 'GET' },
  Duration: 100,
  Events: [{ Timestamp: new Date().toISOString(), Name: 'e', Attributes: {} }],
  Links: [],
} as OtelSpanCh)

test('concurrent inserts/selects/countTotal/moveDataToS3 against the shared instance succeed with no cross-call interference', async () => {
  const errors: any[] = []

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const sessionId = `ds-concurrent-${iteration}`

    await Promise.all(
      Array.from({ length: 5 }, (_, i) => duckdbStore.insert(TABLE, [buildSpan(i, sessionId)])),
    )

    const ongoingInserts = Array.from({ length: 20 }, (_, i) =>
      duckdbStore.insert(TABLE, [buildSpan(i, `ds-other-${iteration}`)])
        .catch(err => errors.push({ type: 'insert', err })))

    // Mirrors stopDebugSessionById's 6-way Promise.all of Store.select with sortOptions.
    const stopSelects = ['ASC', 'DESC'].flatMap(sortDirection =>
      [TABLE].map(table =>
        duckdbStore.select(table, { debugSessionId: sessionId }, { skip: 0, limit: 1 }, undefined, undefined, undefined, {
          sortKey: 'Timestamp', sortDirection,
        }).catch(err => errors.push({ type: 'select', err }))))

    const counts = Array.from({ length: 3 }, () =>
      duckdbStore.countTotal(TABLE, { debugSessionId: sessionId }).catch(err => errors.push({ type: 'countTotal', err })))

    // Mirrors prefetch: 3 on the S3-move queue - up to 3 concurrent moves in flight,
    // each with its own SET s3_* session state.
    const moves = Array.from({ length: 3 }, (_, i) =>
      duckdbStore.moveDataToS3(
        `${S3_HOST}/concurrent-move-test/${iteration}-${i}-${Date.now()}.json`,
        TABLE,
        { debugSessionId: sessionId },
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
      ).catch(err => errors.push({ type: 'move', err })))

    await Promise.all([...ongoingInserts, ...stopSelects, ...counts, ...moves])
  }

  if (errors.length) {
    console.log('ERRORS:', JSON.stringify(errors.map(e => ({ type: e.type, message: e.err?.message })), null, 2))
  }

  expect(errors).toHaveLength(0)
})
