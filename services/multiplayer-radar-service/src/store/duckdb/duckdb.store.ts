import { Readable } from 'stream'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import {
  DuckDBInstance,
  DuckDBConnection,
  mapValue,
  MAP,
  VARCHAR,
  type DuckDBType,
  type DuckDBValue,
} from '@duckdb/node-api'
import {
  DUCKDB_FILE_PATH,
} from '../../config'
import type { IAnalyticsStore } from '../types'
import { getSchemaStatements } from './schema'
import { buildFilter } from './query-builder'

// Columns whose values need an explicit DuckDBValue wrapper + type hint to bind safely
// (plain strings/numbers/booleans bind directly - see Phase 2 plan's verified findings).
const MAP_VARCHAR_COLUMNS = new Set(['ResourceAttributes', 'ScopeAttributes', 'SpanAttributes', 'LogAttributes'])
const JSON_COLUMNS = new Set(['Events', 'Links'])

let instance: DuckDBInstance | undefined
// Store.connect() is fired-and-forgotten at app startup (app.ts) rather than awaited
// before the HTTP server starts listening - Mongoose buffers operations issued before
// its connection is ready, but the raw DuckDB driver doesn't, so a request landing
// during that startup window (schema statements are still running, cold volume, etc)
// used to fail immediately with "Not connected". Tracking the in-flight connect()
// promise here lets getInstance() wait it out instead of failing that race.
let connectPromise: Promise<void> | undefined

const getInstance = async (): Promise<DuckDBInstance> => {
  if (!instance) {
    await connect()
  }

  if (!instance) {
    throw new Error('[DUCKDB] Not connected - call Store.connect() first')
  }

  return instance
}

// DuckDB connections hold mutable per-connection execution state (active prepared
// statement, session SET values, transaction) and aren't safe for concurrent use -
// running overlapping queries on one shared connection is undefined behavior that
// surfaces as generic native errors like "Failed to execute prepared statement" once
// real I/O latency (disk/S3/Kafka) widens the gaps between a query's internal await
// points enough for two calls to interleave. A previous version of this module shared
// a single module-level connection across every concurrent Store call and hit exactly
// that. Separate connections to the same DuckDBInstance *are* safe to use concurrently
// (DuckDB's own concurrency model), so every top-level call below gets its own
// short-lived connection instead.
const withConnection = async <T>(fn: (conn: DuckDBConnection) => Promise<T>): Promise<T> => {
  const inst = await getInstance()
  const conn = await inst.connect()

  try {
    return await fn(conn)
  } finally {
    conn.closeSync()
  }
}

const connect = async (): Promise<void> => {
  if (instance) {
    return
  }

  if (!connectPromise) {
    connectPromise = (async () => {
      // DuckDB won't create missing parent directories itself (fails with "IO Error:
      // Cannot open file ... No such file or directory") - ensure it exists regardless
      // of deployment (bare-metal default path, a fresh bind mount, a not-yet-
      // materialized volume mount point, etc). No-op for the ":memory:" sentinel used
      // in tests.
      if (DUCKDB_FILE_PATH !== ':memory:') {
        mkdirSync(dirname(DUCKDB_FILE_PATH), { recursive: true })
      }

      instance = await DuckDBInstance.create(DUCKDB_FILE_PATH)
      const setupConn = await instance.connect()

      try {
        for (const statement of getSchemaStatements()) {
          await setupConn.run(statement)
        }
      } finally {
        setupConn.closeSync()
      }
    })()
  }

  try {
    await connectPromise
  } finally {
    connectPromise = undefined
  }
}

const disconnect = async (): Promise<void> => {
  instance?.closeSync()
  instance = undefined
}

const connected = async (): Promise<boolean> => !!instance

const buildOrderBy = (sortOptions?: any): string => {
  if (!sortOptions) {
    return ''
  }

  const options = Array.isArray(sortOptions) ? sortOptions : [sortOptions]

  if (!options.length) {
    return ''
  }

  return `ORDER BY ${options.map(s => `${s.sortKey} ${s.sortDirection}`).join(', ')}`
}

const buildLimitOffset = (cursor?: { skip: number, limit: number }): string => (
  typeof cursor?.skip === 'number' && typeof cursor?.limit === 'number'
    ? `LIMIT ${cursor.limit} OFFSET ${cursor.skip}`
    : ''
)

const select = async (
  table: string,
  filter: any,
  cursor?: { skip: number, limit: number },
  selectFields?: string,
  join?: string,
  groupBy?: string,
  sortOptions?: any,
): Promise<any> => {
  const conditions = buildFilter(filter)
  const query = `SELECT ${selectFields || '*'}
  FROM ${table}
  ${join || ''}
  ${conditions ? `WHERE ${conditions}` : ''}
  ${groupBy || ''}
  ${buildOrderBy(sortOptions)}
  ${buildLimitOffset(cursor)};`

  return withConnection(async conn => {
    const reader = await conn.runAndReadAll(query)

    return reader.getRowObjectsJson()
  })
}

const selectStream = async (
  table: string,
  filter: any,
  cursor?: { skip: number, limit: number },
  selectFields?: string,
  join?: string,
  groupBy?: string,
  sortOptions?: any,
): Promise<Readable> => {
  // Runs the full query then wraps the result in a Readable, rather than true
  // incremental streaming - a deliberate simplification for a backend whose whole
  // premise is lightweight/self-hosted, not ClickHouse-scale trace volumes. See the
  // Phase 2 plan.
  const rows = await select(table, filter, cursor, selectFields, join, groupBy, sortOptions)

  return Readable.from(rows)
}

const countTotal = async (table: string, filter: any, join?: string): Promise<number> => {
  const conditions = buildFilter(filter)
  const query = `SELECT count(*) as c FROM ${table} ${join || ''} WHERE ${conditions};`

  return withConnection(async conn => {
    const reader = await conn.runAndReadAll(query)
    const [row] = reader.getRowObjectsJson()

    return Number(row?.c || 0)
  })
}

const remove = async (table: string, filter: any): Promise<void> => {
  const conditions = buildFilter(filter)

  await withConnection(conn => conn.run(`DELETE FROM ${table} WHERE ${conditions}`))
}

/** Wraps a plain JS value for DuckDB parameter binding where a type hint is required
 * (lists/maps can't be inferred from a plain array/object - verified against the real
 * engine, see Phase 2 plan). Returns undefined for null/undefined so the caller can
 * omit the column from the INSERT entirely rather than bind an untyped null. */
const prepareValue = (column: string, value: any): { value: DuckDBValue, type?: DuckDBType } | undefined => {
  if (value === null || value === undefined) {
    return undefined
  }

  if (value instanceof Date) {
    return { value: value.toISOString() }
  }

  if (MAP_VARCHAR_COLUMNS.has(column) && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, val]) => ({ key, value: String(val) }))

    return { value: mapValue(entries), type: MAP(VARCHAR, VARCHAR) }
  }

  if (JSON_COLUMNS.has(column)) {
    return { value: JSON.stringify(value) }
  }

  return { value }
}

const buildInsertStatement = (table: string, row: Record<string, any>) => {
  const values: Record<string, DuckDBValue> = {}
  const types: Record<string, DuckDBType> = {}
  const columns: string[] = []

  for (const column of Object.keys(row)) {
    const prepared = prepareValue(column, row[column])

    if (!prepared) {
      continue
    }

    columns.push(column)
    values[column] = prepared.value
    if (prepared.type) {
      types[column] = prepared.type
    }
  }

  const placeholders = columns.map(c => `$${c}`)

  return {
    columns,
    values,
    types,
    columnList: columns.map(c => `"${c}"`).join(', '),
    placeholderList: placeholders.join(', '),
  }
}

// Every remaining table (otel_traces/otel_logs/rrweb_events) is pure append, matching
// ClickHouse's behavior for those tables today - no upsert/conflict handling needed.
const insertOne = async (conn: DuckDBConnection, table: string, row: Record<string, any>): Promise<void> => {
  const { columnList, placeholderList, values, types } = buildInsertStatement(table, row)

  const sql = `INSERT INTO ${table} (${columnList}) VALUES (${placeholderList})`

  await conn.run(sql, values, types)
}

// asyncInsert is a ClickHouse-specific write-buffering hint (see
// libs/multiplayer-clickhouse-lib) with no DuckDB equivalent - accepted for interface
// compatibility, ignored here. Rows are inserted one at a time via parameterized
// queries rather than a batched multi-row VALUES with string interpolation - see the
// Phase 2 plan for why (this is new code, not a port of existing behavior, so it
// doesn't need to replicate the ClickHouse query-builder's naive interpolation).
const insert = async (table: string, data: any, _asyncInsert?: boolean): Promise<void> => {
  const rows: Record<string, any>[] = Array.isArray(data) ? data : [data]

  await withConnection(async conn => {
    for (const row of rows) {
      await insertOne(conn, table, row)
    }
  })
}

const moveDataToS3 = async (
  absoluteS3FileUrl: string,
  table: string,
  filter: any,
  s3AccessKeyId?: string,
  secretAccessKey?: string,
  // Accepted for interface compatibility only: ClickHouse's own `buildReplace` has a
  // pre-existing bug (iterates the wrong variable) that makes it silently a no-op in
  // production today - not something this DuckDB path needs to newly support.
  _replace?: object,
): Promise<void> => {
  const url = new URL(absoluteS3FileUrl)
  const [, bucket, ...keyParts] = url.pathname.split('/')
  const key = keyParts.join('/')
  const conditions = buildFilter(filter)

  // SET s3_* is connection-scoped session state, and moveDataToS3 calls can run
  // concurrently (AMQP_DEBUG_SESSION_MOVE_S3_QUEUE prefetches several at once) with
  // different credentials/endpoints - each call must own its own connection so
  // concurrent moves can't clobber each other's S3 settings mid-flight.
  await withConnection(async conn => {
    await conn.run('INSTALL httpfs')
    await conn.run('LOAD httpfs')
    await conn.run(`SET s3_endpoint='${url.host}'`)
    await conn.run(`SET s3_use_ssl=${url.protocol === 'https:'}`)
    await conn.run('SET s3_url_style=\'path\'')

    if (s3AccessKeyId && secretAccessKey) {
      await conn.run(`SET s3_access_key_id='${s3AccessKeyId}'`)
      await conn.run(`SET s3_secret_access_key='${secretAccessKey}'`)
    }

    await conn.run(`COPY (SELECT * FROM ${table} ${conditions ? `WHERE ${conditions}` : ''}) TO 's3://${bucket}/${key}' (FORMAT JSON)`)
  })
}

export const duckdbStore: IAnalyticsStore = {
  connect,
  disconnect,
  connected,
  select,
  selectStream,
  countTotal,
  insert,
  remove,
  moveDataToS3,
}
