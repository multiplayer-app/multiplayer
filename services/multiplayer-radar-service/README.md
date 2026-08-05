# Multiplayer radar

## Variables

| Variable name                                         | Description                                     | Required | Default                                       |
|-------------------------------------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `PORT`                                                | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `CORS_DOMAIN`                                         | CORS                                            |   ✘      | `*`                                           |
| `API_PREFIX`                                          | App http uri prefix. Ex.: `/v0/radar`            |   ✘      | /v0/radar                                     |
| `SWAGGER_ENABLED`                                     | Enable Swagger                                  |   ✘      | `false`                                       |
| `CLICKHOUSE_DEBUG_SESSION_DB`                         |                                                 |   ✘      | `debug_session`                               |
| `CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME`           |                                                 |   ✘      | `rrweb_events`                                |
| `VERSION_SERVICE_URI`                                 |                                                 |   ✘      | `http://localhost:3000/v0/version`            |
| `INTERNAL_VERSION_SERVICE_URI`                        |                                                 |   ✘      | `http://localhost:3000/internal/v0/version`   |
| `INTERNAL_GIT_SERVICE_URI`                            |                                                 |   ✘      | `http://localhost:3000/internal/v0/git`       |
| `INTERNAL_COLLABORATION_SERVICE_URI`                  |                                                 |   ✘      | `http://localhost:3002/internal/v0/collaboration` |
| `AMQP_RADAR_DETECTION_APPLY_QUEUE`                    | radar detection apply queue                     |   ✘      | `radar-detection-apply`                       |
| `AMQP_EVENT_QUEUE`                                    |                                                 |   ✘      | `event`                                       |
| `AMQP_RADAR_EVENT_QUEUE`                              |                                                 |   ✘      | `radar-event`                                 |
| `INTEGRATION_JWT_SECRET`                              |                                                 |   ✘      | `sample_jwt_secret`                           |
| `KAFKA_URI`                                           |                                                 |   ✘      |                                               |
| `KAFKA_AUTH_MECHANISM`                                | `plain` (self-hosted) or `gcp-oauthbearer` (Google Cloud Managed Service for Apache Kafka, auths via the pod's attached GCP service account) |   ✘      | `plain`                                       |
| `KAFKA_OTEL_D0C_TRACES_TOPIC`                         |                                                 |   ✘      | `otlp_spans_d0c`                              |
| `KAFKA_OTEL_DEB_TRACES_TOPIC`                         |                                                 |   ✘      | `otlp_spans_deb`                              |
| `KAFKA_OTEL_DEB_LOGS_TOPIC`                           |                                                 |   ✘      | `otlp_logs_deb`                               |
| `REDIS_OTEL_TRACE_ID_CACHE_PREFIX`                    |                                                 |   ✘      | `otel_traces:`                                |
| `REDIS_OTEL_TRACE_ID_CACHE_TTL`                       |                                                 |   ✘      | 10                                            |
| `REDIS_OTEL_DEBUG_SESSION_CACHE_PREFIX`               |                                                 |   ✘      | `debug_session:`                              |
| `REDIS_OTEL_DEBUG_SESSION_CACHE_TTL`                  |                                                 |   ✘      | 10                                            |
| `REDIS_OTEL_FLOW_KEY_CACHE_PREFIX`                    |                                                 |   ✘      | `flow_key:`                                    |
| `REDIS_OTEL_FLOW_DATA_CACHE_PREFIX`                   |                                                 |   ✘      | `flow:`                                        |
| `REDIS_OTEL_FLOW_KEY_CACHE_TTL`                       |                                                 |   ✘      | 10                                            |
| `REDIS_DEBUG_SESSION_CACHE_PREFIX`                    |                                                 |   ✘      | `debug_session:`                              |
| `DEBUG_SESSION_MAX_DURATION_SECONDS`                  |                                                 |   ✘      | 300                                           |
| `S3_DEBUG_SESSIONS_BUCKET`                            |                                                 |   ✘      | `debug-sessions-bucket`                       |
| `ANALYTICS_DB_ENGINE`                                 | `clickhouse` or `duckdb`. `duckdb` is a lightweight, fully self-hosted alternative that trades ClickHouse's server/scale-out model for a single embedded file (single replica only until leader-election support lands). |   ✘      | `clickhouse`                                  |
| `DUCKDB_FILE_PATH`                                    | Only used when `ANALYTICS_DB_ENGINE=duckdb`. Must be on a persistent volume in any real deployment. |   ✘      | `./data/radar.duckdb`                         |

Also check library environment variables:

https://github.com/protocolr/protocolr-mongo-lib#environment-variables

https://github.com/protocolr/protocolr-auth-lib#environment-variables

## Clickhouse

```sql
CREATE DATABASE IF NOT EXISTS debug_session;

CREATE TABLE IF NOT EXISTS debug_session.rrweb_events
(
  `id` String CODEC(ZSTD(1)),
  `workspaceId` String CODEC(ZSTD(1)),
  `projectId` String CODEC(ZSTD(1)),
  `debugSessionId` String CODEC(ZSTD(1)),
  `type` UInt8,
  `data` String,
  `timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
  INDEX idx_debug_session_id debugSessionId TYPE bloom_filter(0.001) GRANULARITY 1
)
ENGINE = MergeTree
PARTITION BY debugSessionId
ORDER BY (toUnixTimestamp(timestamp), debugSessionId)
TTL toDateTime(timestamp) + toIntervalHour(3);

CREATE TABLE debug_session.otel_traces
(
    `id` String CODEC(ZSTD(1)),
    `debugSessionId` String,
    `Timestamp` DateTime64(9) CODEC(Delta, ZSTD(1)),
    `TraceId` String CODEC(ZSTD(1)),
    `SpanId` String CODEC(ZSTD(1)),
    `ParentSpanId` String CODEC(ZSTD(1)),
    `TraceState` String CODEC(ZSTD(1)),
    `SpanName` LowCardinality(String) CODEC(ZSTD(1)),
    `SpanKind` LowCardinality(String) CODEC(ZSTD(1)),
    `ServiceName` LowCardinality(String) CODEC(ZSTD(1)),
    `ResourceAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `ScopeName` String CODEC(ZSTD(1)),
    `ScopeVersion` String CODEC(ZSTD(1)),
    `SpanAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `Duration` UInt64 CODEC(ZSTD(1)),
    `StatusCode` LowCardinality(String) CODEC(ZSTD(1)),
    `StatusMessage` String CODEC(ZSTD(1)),
    `Events` Nested (
      `Timestamp` DateTime64(9),
      `Name` LowCardinality(String),
      `Attributes` Map(LowCardinality(String), String)
    ) CODEC(ZSTD(1)),
    `Links` Nested (
      `TraceId` String,
      `SpanId` String,
      `TraceState` String,
      `Attributes` Map(LowCardinality(String), String)
    ) CODEC(ZSTD(1)),
    INDEX idx_debug_session_id debugSessionId TYPE bloom_filter(0.001) GRANULARITY 1
)
ENGINE = MergeTree
PARTITION BY debugSessionId
ORDER BY (toUnixTimestamp(Timestamp), debugSessionId)
TTL toDateTime(Timestamp) + toIntervalHour(3);

CREATE TABLE debug_session.otel_logs
(
    `id` String CODEC(ZSTD(1)),
    `debugSessionId` String,
    `Timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
    `TraceId` String CODEC(ZSTD(1)),
    `SpanId` String CODEC(ZSTD(1)),
    `TraceFlags` UInt32 CODEC(ZSTD(1)),
    `SeverityText` LowCardinality(String) CODEC(ZSTD(1)),
    `SeverityNumber` Int32 CODEC(ZSTD(1)),
    `ServiceName` LowCardinality(String) CODEC(ZSTD(1)),
    `Body` String CODEC(ZSTD(1)),
    `ResourceSchemaUrl` String CODEC(ZSTD(1)),
    `ResourceAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `ScopeSchemaUrl` String CODEC(ZSTD(1)),
    `ScopeName` String CODEC(ZSTD(1)),
    `ScopeVersion` String CODEC(ZSTD(1)),
    `ScopeAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `LogAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    INDEX idx_debug_session_id debugSessionId TYPE bloom_filter(0.001) GRANULARITY 1
)
ENGINE = MergeTree
PARTITION BY debugSessionId
ORDER BY (toUnixTimestamp(Timestamp), debugSessionId)
TTL toDateTime(Timestamp) + toIntervalHour(3);

-- Continuous (always-on, rolling-buffer) debug sessions write into these same
-- rrweb_events/otel_traces/otel_logs tables - same 3-hour TTL as manual sessions, so
-- the async debug-session-move-s3 archival job always has time to run first.
```

`debug_session` is the only database a fresh ClickHouse/DuckDB instance needs. The
`otel` (`otel_metrics_gauge`) and `radar` (`detections`, `detection_params`, `flows`)
databases are no longer part of the schema this service creates - that data lives in
MongoDB now (see `metrics-gauge.model.ts`, `radar-detection.model.ts`, `flow.model.ts`).
`radar.detections`/`radar.detection_params` still exist in already-provisioned
ClickHouse instances purely as a migration source for
`scripts/migrate-detections-to-mongo`; `radar.flows`/`otel.otel_metrics_gauge` have no
migration script (real usage was tiny - 21.5kB/1.5MB - at the time of this cleanup) and
are simply left orphaned in already-provisioned instances until removed by ops.

### OTEL Attributes

Expect following optional attributes:

`multiplayer.client.id` - external client id. Can be overridden with env `EXTERNAL_CLIENT_ID_ATTRIBUTE_NAME`.


### How to run radar locally?

1) Clone repo with collector https://github.com/multiplayer-app/opentelemetry-collector-contrib
2) Switch to branch `otel-jwt-auth`
3) Install golang
4) Build collector docker image: `make docker-otelcontribcol`
5) Uncomment service in docker-compose.yml `otel-collector`
6) Create otel/radar token
7) Update env variable with radar token in .env located in root of monorepo. Env name: `OTEL_EXPORTER_OTLP_HEADERS`, which has following format: `Authorization={{RADAR_TOKEN}}`
8) Create tables for radar detections in clickhouse. Open clickhouse playground page http://localhost:8123/play and run one by one commands [above](#clickhouse)
