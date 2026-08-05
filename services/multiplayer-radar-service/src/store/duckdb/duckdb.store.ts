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
let connection: DuckDBConnection | undefined

const getConnection = (): DuckDBConnection => {
  if (!connection) {
    throw new Error('[DUCKDB] Not connected - call Store.connect() first')
  }

  return connection
}

const connect = async (): Promise<void> => {
  if (connection) {
    return
  }

  // DuckDB won't create missing parent directories itself (fails with "IO Error:
  // Cannot open file ... No such file or directory") - ensure it exists regardless of
  // deployment (bare-metal default path, a fresh bind mount, a not-yet-materialized
  // volume mount point, etc). No-op for the ":memory:" sentinel used in tests.
  if (DUCKDB_FILE_PATH !== ':memory:') {
    mkdirSync(dirname(DUCKDB_FILE_PATH), { recursive: true })
  }

  instance = await DuckDBInstance.create(DUCKDB_FILE_PATH)
  connection = await instance.connect()

  for (const statement of getSchemaStatements()) {
    await connection.run(statement)
  }
}

const disconnect = async (): Promise<void> => {
  connection?.closeSync()
  connection = undefined
  instance = undefined
}

const connected = async (): Promise<boolean> => !!connection

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

  const reader = await getConnection().runAndReadAll(query)

  return reader.getRowObjectsJson()
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
  const reader = await getConnection().runAndReadAll(query)
  const [row] = reader.getRowObjectsJson()

  return Number(row?.c || 0)
}

const remove = async (table: string, filter: any): Promise<void> => {
  const conditions = buildFilter(filter)

  await getConnection().run(`DELETE FROM ${table} WHERE ${conditions}`)
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
const insertOne = async (table: string, row: Record<string, any>): Promise<void> => {
  const { columnList, placeholderList, values, types } = buildInsertStatement(table, row)

  const sql = `INSERT INTO ${table} (${columnList}) VALUES (${placeholderList})`

  await getConnection().run(sql, values, types)
}

// asyncInsert is a ClickHouse-specific write-buffering hint (see
// libs/multiplayer-clickhouse-lib) with no DuckDB equivalent - accepted for interface
// compatibility, ignored here. Rows are inserted one at a time via parameterized
// queries rather than a batched multi-row VALUES with string interpolation - see the
// Phase 2 plan for why (this is new code, not a port of existing behavior, so it
// doesn't need to replicate the ClickHouse query-builder's naive interpolation).
const insert = async (table: string, data: any, _asyncInsert?: boolean): Promise<void> => {
  const rows: Record<string, any>[] = Array.isArray(data) ? data : [data]

  for (const row of rows) {
    await insertOne(table, row)
  }
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
  const conn = getConnection()

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
