import {
  CLICKHOUSE_DEBUG_SESSION_DB,
  CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME,
  CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME,
  CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME,
} from '../../config'

// Pure append-only tables (per OtelSpanCh/OtelLogCh/IDebugSessionRrwebEvent) - no PK, no
// upsert, no Sign. *Attributes columns use MAP so the existing
// `Attributes['some.key']`-style bracket filters (see metrics.service.ts,
// debug-session.service.ts) work unchanged against DuckDB's native map indexing.
const otelTraceColumns = `
  id VARCHAR,
  debugSessionId VARCHAR,
  "Timestamp" TIMESTAMP,
  TraceId VARCHAR,
  SpanId VARCHAR,
  ParentSpanId VARCHAR,
  TraceState VARCHAR,
  SpanName VARCHAR,
  SpanKind INTEGER,
  ServiceName VARCHAR,
  ResourceAttributes MAP(VARCHAR, VARCHAR),
  ScopeName VARCHAR,
  ScopeVersion VARCHAR,
  SpanAttributes MAP(VARCHAR, VARCHAR),
  Duration BIGINT,
  StatusCode VARCHAR,
  StatusMessage VARCHAR,
  Events JSON,
  Links JSON
`

const otelLogColumns = `
  id VARCHAR,
  debugSessionId VARCHAR,
  "Timestamp" TIMESTAMP,
  TraceId VARCHAR,
  SpanId VARCHAR,
  TraceFlags INTEGER,
  SeverityText VARCHAR,
  SeverityNumber INTEGER,
  ServiceName VARCHAR,
  Body VARCHAR,
  ResourceSchemaUrl VARCHAR,
  ResourceAttributes MAP(VARCHAR, VARCHAR),
  ScopeSchemaUrl VARCHAR,
  ScopeName VARCHAR,
  ScopeVersion VARCHAR,
  ScopeAttributes MAP(VARCHAR, VARCHAR),
  LogAttributes MAP(VARCHAR, VARCHAR)
`

const rrwebEventColumns = `
  id VARCHAR,
  workspaceId VARCHAR,
  projectId VARCHAR,
  debugSessionId VARCHAR,
  type INTEGER,
  data VARCHAR,
  "timestamp" TIMESTAMP
`

const table = (db: string, name: string, columns: string) => `CREATE TABLE IF NOT EXISTS "${db}"."${name}" (${columns})`

export const getSchemaStatements = (): string[] => [
  `CREATE SCHEMA IF NOT EXISTS "${CLICKHOUSE_DEBUG_SESSION_DB}"`,

  table(CLICKHOUSE_DEBUG_SESSION_DB, CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME, otelTraceColumns),
  table(CLICKHOUSE_DEBUG_SESSION_DB, CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME, otelLogColumns),
  table(CLICKHOUSE_DEBUG_SESSION_DB, CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME, rrwebEventColumns),
]
