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
| `ANALYTICS_DB_ENGINE`                                 | `clickhouse` or `duckdb`. `duckdb` is a lightweight, fully self-hosted alternative that trades ClickHouse's server/scale-out model for a single embedded file. Safe with multiple replicas via Redis leader election - see "DuckDB with multiple replicas" below. |   ✘      | `clickhouse`                                  |
| `DUCKDB_FILE_PATH`                                    | Only used when `ANALYTICS_DB_ENGINE=duckdb`. Must be on a persistent volume in any real deployment. |   ✘      | `./data/radar.duckdb`                         |
| `AMQP_STORE_RPC_QUEUE`                                | Only used when `ANALYTICS_DB_ENGINE=duckdb`. Queue non-leader replicas use to forward Store calls to the elected leader. |   ✘      | `radar-duckdb-store-rpc`                      |
| `REDIS_STORE_LEADER_KEY`                              | Only used when `ANALYTICS_DB_ENGINE=duckdb`. Redis key holding the DuckDB store leader election lease. |   ✘      | `radar:duckdb:leader`                         |
| `STORE_LEADER_TTL_SECONDS`                            | Only used when `ANALYTICS_DB_ENGINE=duckdb`. Lease TTL - a dead leader's lease expires and another replica takes over after this long. |   ✘      | 15                                            |
| `STORE_LEADER_RENEW_INTERVAL_MS`                      | Only used when `ANALYTICS_DB_ENGINE=duckdb`. How often the leader renews its lease / followers poll for a leadership change. |   ✘      | 5000                                          |
| `STORE_FORWARD_TIMEOUT_MS`                            | Only used when `ANALYTICS_DB_ENGINE=duckdb`. Timeout for a follower's forwarded Store RPC call. Should comfortably exceed the worst-case failover window (`STORE_LEADER_TTL_SECONDS` + one renew tick). |   ✘      | 30000                                         |
| `STORE_FORWARD_S3_MOVE_TIMEOUT_MS`                    | Only used when `ANALYTICS_DB_ENGINE=duckdb`. Longer timeout override for the forwarded S3-archival call specifically. |   ✘      | 300000                                        |

Also check library environment variables:

https://github.com/protocolr/protocolr-mongo-lib#environment-variables

https://github.com/protocolr/protocolr-auth-lib#environment-variables

## DuckDB with multiple replicas

`ANALYTICS_DB_ENGINE=duckdb` stores debug-session traces/logs/rrweb events as a single
embedded file (`DUCKDB_FILE_PATH`) local to each pod - there's no shared/networked
database the way ClickHouse is. With more than one replica and non-shared volumes,
writes would otherwise fragment across replicas (Kafka partitions by trace id, not
session; HTTP/WebSocket traffic lands on whichever pod the load balancer picks), so
reads would only ever see whatever slice of a session's data happened to land on the
pod serving that request.

This is solved via Redis leader election (`src/store/leader-election.ts`): exactly one
replica is elected leader and is the only one that ever touches its local DuckDB file.

- **Reads/writes**: every replica's `Store` is a facade (`src/store/index.ts`) that
  runs locally when this replica is leader, or forwards to the leader over AMQP
  request/reply (`src/store/remote/remote.store.ts` / `src/store/leader-listener.ts`,
  queue `AMQP_STORE_RPC_QUEUE`) when it's a follower. This covers every entry point
  uniformly - HTTP routes, WebSocket rrweb writes, the AMQP S3-archival queue, and the
  cron sweep - since they all go through the same `Store` singleton.
- **Kafka ingest**: the 5 topics that feed the analytics store (debug/continuous-debug
  session spans+logs, error spans) run on their own consumer group
  (`<service-name>-store`) that only the leader consumes - started on leadership gain,
  stopped on loss. This keeps the highest-volume path off AMQP entirely and makes it
  failover-safe: while no replica is leader, messages simply wait in Kafka rather than
  being forwarded-and-lost (the underlying kafka client library commits offsets even
  when a handler throws, so a failed forward would otherwise be silently dropped).

Requirements for this to work: all replicas must share the same Redis instance and be
able to reach the same RabbitMQ broker (both already required elsewhere in this
service). No pod-to-pod networking is needed - routing is entirely by Redis key /
AMQP queue name, never by replica address.

**Accepted limitations**, given this data is short-lived and archived to S3 at session
stop anyway:
- Rows written to the pre-failover leader's local file are unreachable until that pod
  (or its replacement) leads again - the loss window is bounded to sessions active
  across a failover, detected within `STORE_LEADER_TTL_SECONDS` plus one renew tick.
- The Kafka consumer-group split means the very first deploy of this feature starts the
  new `<service-name>-store` group at the latest offset, not from where the old shared
  group left off - a one-time gap equivalent to brief deploy downtime.
- Moving a debug session's data to S3 (`moveDataToS3`) spans a count and a copy; if
  leadership changes between them, the count could be stale relative to what actually
  got archived. The AMQP queue redelivers once on failure, which narrows but doesn't
  eliminate this window.
- With `ANALYTICS_DB_ENGINE=clickhouse` (a real shared server), none of this applies -
  leader election never starts and the store consumer runs unconditionally on every
  replica, exactly as before this feature existed.

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
