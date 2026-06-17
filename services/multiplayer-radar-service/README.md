# Multiplayer radar

## Variables

| Variable name                                         | Description                                     | Required | Default                                       |
|-------------------------------------------------------|-------------------------------------------------|----------|-----------------------------------------------|
| `PORT`                                                | App listen http port. Ex.: `3000`               |   ✘      | 3000                                          |
| `CORS_DOMAIN`                                         | CORS                                            |   ✘      | `*`                                           |
| `API_PREFIX`                                          | App http uri prefix. Ex.: `/v0/radar`            |   ✘      | /v0/radar                                     |
| `SWAGGER_ENABLED`                                     | Enable Swagger                                  |   ✘      | `false`                                       |
| `CLICKHOUSE_OTEL_TRACES_TABLE_NAME`                   | CH table name for traces                        |   ✘      | `otel_traces`                                 |
| `CLICKHOUSE_OTEL_LOGS_TABLE_NAME`                     | CH table name for logs                          |   ✘      | `otel_logs`                                   |
| `CLICKHOUSE_OTEL_RADAR_DB`                            |                                                 |   ✘      | `radar`                                       |
| `CLICKHOUSE_OTEL_DETECTIONS_TABLE_NAME`               |                                                 |   ✘      | `detections`                                  |
| `CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME`        |                                                 |   ✘      | `detection_params`                            |
| `CLICKHOUSE_DEBUG_SESSION_DB`                         |                                                 |   ✘      | `debug_session`                               |
| `CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME`           |                                                 |   ✘      | `rrweb_events`                                |
| `CLICKHOUSE_OTEL_FLOWS_TABLE_NAME`                    |                                                 |   ✘      | `flows`                                        |
| `VERSION_SERVICE_URI`                                 |                                                 |   ✘      | `http://localhost:3000/v0/version`            |
| `INTERNAL_VERSION_SERVICE_URI`                        |                                                 |   ✘      | `http://localhost:3000/internal/v0/version`   |
| `INTERNAL_GIT_SERVICE_URI`                            |                                                 |   ✘      | `http://localhost:3000/internal/v0/git`       |
| `AMQP_COLLABORATION_RPC_QUEUE`                        | collaboration service rpc queue                 |   ✘      | `collaboration-rpc`                           |
| `AMQP_RADAR_DETECTION_APPLY_QUEUE`                    | radar detection apply queue                     |   ✘      | `radar-detection-apply`                       |
| `AMQP_EVENT_QUEUE`                                    |                                                 |   ✘      | `event`                                       |
| `AMQP_RADAR_EVENT_QUEUE`                              |                                                 |   ✘      | `radar-event`                                 |
| `INTEGRATION_JWT_SECRET`                              |                                                 |   ✘      | `sample_jwt_secret`                           |
| `KAFKA_URI`                                           |                                                 |   ✘      |                                               |
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

CREATE DATABASE IF NOT EXISTS otel;

CREATE TABLE otel.otel_metrics_gauge (
    `ResourceAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `ResourceSchemaUrl` String CODEC(ZSTD(1)),
    `ScopeName` String CODEC(ZSTD(1)),
    `ScopeVersion` String CODEC(ZSTD(1)),
    `ScopeAttributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `ScopeDroppedAttrCount` UInt32 CODEC(ZSTD(1)),
    `ScopeSchemaUrl` String CODEC(ZSTD(1)),
    `ServiceName` LowCardinality(String) CODEC(ZSTD(1)),
    `MetricName` String CODEC(ZSTD(1)),
    `MetricDescription` String CODEC(ZSTD(1)),
    `MetricUnit` String CODEC(ZSTD(1)),
    `Attributes` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `StartTimeUnix` DateTime64(9) CODEC(Delta, ZSTD(1)),
    `TimeUnix` DateTime64(9) CODEC(Delta, ZSTD(1)),
    `Value` Float64 CODEC(ZSTD(1)),
    `Flags` UInt32 CODEC(ZSTD(1)),
    `Exemplars` Nested (
        FilteredAttributes Map(LowCardinality(String), String),
        TimeUnix DateTime64(9),
        Value Float64,
        SpanId String,
        TraceId String
    ) CODEC(ZSTD(1)),
    INDEX idx_res_attr_key mapKeys(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_res_attr_value mapValues(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scope_attr_key mapKeys(ScopeAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scope_attr_value mapValues(ScopeAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_attr_key mapKeys(Attributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_attr_value mapValues(Attributes) TYPE bloom_filter(0.01) GRANULARITY 1
) ENGINE = MergeTree
PARTITION BY toDate(TimeUnix)
ORDER BY (ServiceName, MetricName, Attributes, toUnixTimestamp64Nano(TimeUnix))
TTL toDateTime(TimeUnix) + toIntervalDay(90)
SETTINGS index_granularity=8192, ttl_only_drop_parts = 1;

CREATE TABLE otel.otel_traces (
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
  INDEX idx_trace_id TraceId TYPE bloom_filter(0.001) GRANULARITY 1,
  INDEX idx_res_attr_key mapKeys(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
  INDEX idx_res_attr_value mapValues(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
  INDEX idx_span_attr_key mapKeys(SpanAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
  INDEX idx_span_attr_value mapValues(SpanAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
  INDEX idx_duration Duration TYPE minmax GRANULARITY 1
) ENGINE = MergeTree
PARTITION BY toDate(Timestamp)
ORDER BY (ServiceName, SpanName, toDateTime(Timestamp))
TTL toDateTime(Timestamp) + toIntervalDay(90)
SETTINGS index_granularity=8192, ttl_only_drop_parts = 1;

CREATE DATABASE IF NOT EXISTS radar;

CREATE TABLE IF NOT EXISTS radar.detections (
  `collapse_id` String CODEC(ZSTD(1)),
  `id` String  CODEC(ZSTD(1)),
  
  `Sign` Int8,
  `workspaceId` String CODEC(ZSTD(1)),
  `projectId` String CODEC(ZSTD(1)),
  `integrationId` String CODEC(ZSTD(1)),
  `platformId` String CODEC(ZSTD(1)),
  `entityId` String CODEC(ZSTD(1)),

  `type` String,
  `tags` Array(Tuple(String, String)),
  `componentName` String,
  `hostname` String,

  `componentAliasName` Bool,
  `mainRefId` String  CODEC(ZSTD(1)),

  `environmentName` String,

  `endpointType` String,
  
  `httpMethod` String,
  `httpEndpoint` String,
  `rpcSystem` String,
  `rpcService` String,
  `rpcMethod` String,
  `messagingSystem` String,
  `messagingDestination` String,
  
  `dependencyType` String CODEC(ZSTD(1)),

  `sourceComponentName` String,
  `sourceEntityId` String,
  `sourceEndpointType` String,
  `sourceHttpMethod` String,
  `sourceHttpEndpoint` String,
  `sourceRpcSystem` String,
  `sourceRpcService` String,
  `sourceRpcMethod` String,
  `sourceMessagingSystem` String,
  `sourceMessagingDestination` String,
  
  `targetComponentName` String,
  `targetEntityId` String,
  `targetEndpointType` String,
  `targetHttpMethod` String,
  `targetHttpEndpoint` String,
  `targetRpcSystem` String,
  `targetRpcService` String,
  `targetRpcMethod` String,
  `targetMessagingSystem` String,
  `targetMessagingDestination` String,
  
  `Timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),

  INDEX idx_id id TYPE bloom_filter(0.001) GRANULARITY 1,
  INDEX idx_workspace_id_project_id (workspaceId, projectId) TYPE bloom_filter(0.001) GRANULARITY 1
)
ENGINE = ReplacingMergeTree(Timestamp)
ORDER BY collapse_id;

CREATE TABLE IF NOT EXISTS radar.detection_params (
  `collapse_id` String CODEC(ZSTD(1)),
  `id` String CODEC(ZSTD(1)),
  `Sign` Int8,
  `endpointId` String CODEC(ZSTD(1)),

  `workspaceId` String CODEC(ZSTD(1)),
  `projectId` String CODEC(ZSTD(1)),
  `integrationId` String CODEC(ZSTD(1)),
  `platformId` String CODEC(ZSTD(1)),
  `entityId` String CODEC(ZSTD(1)),

  `environmentName` String,
  `componentName` String,
  `componentAliasName` Bool,
  `mainRefId` String  CODEC(ZSTD(1)),

  `endpointType` String CODEC(ZSTD(1)),
  
  `httpMethod` String,
  `httpEndpoint` String,
  `httpStatus` Int32,

  `messagingSystem` String,
  `messagingDestination` String,

  `rpcSystem` String,
  `rpcService` String,
  `rpcMethod` String,

  `paramDirection` String,
  `paramSource` String,
  `paramPath` String,
  `paramType` String,
  `paramFormat` String,

  `Timestamp` DateTime64(9) CODEC(Delta(8), ZSTD(1)),

  INDEX idx_id id TYPE bloom_filter(0.001) GRANULARITY 1,
  INDEX idx_workspace_id_project_id (workspaceId, projectId) TYPE bloom_filter(0.001) GRANULARITY 1
)
ENGINE = ReplacingMergeTree(Timestamp)
ORDER BY collapse_id;

CREATE TABLE IF NOT EXISTS radar.flows (
  `id` String  CODEC(ZSTD(1)),
  `workspaceId` String,
  `projectId` String,
  `sequence` Array(Tuple(
    componentName String,
    httpEndpoint String,
    httpMethod String,
    spanId String,
    parentSpanId String,
    kind UInt8,
    name String,
    httpStatus Int32,
    messagingSystem String,
    messagingDestination String,
    dbSystem String,
    rpcSystem String,
    rpcService String,
    rpcMethod String
  )),
  `Timestamp` DateTime64(3, 'UTC'),

  INDEX idx_id id TYPE bloom_filter(0.001) GRANULARITY 1,
  INDEX idx_workspace_id_project_id (workspaceId, projectId) TYPE bloom_filter(0.001) GRANULARITY 1
) ENGINE = ReplacingMergeTree(Timestamp) ORDER BY id;

CREATE DATABASE IF NOT EXISTS continuous_debug_session;

CREATE TABLE IF NOT EXISTS continuous_debug_session.rrweb_events
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
TTL toDateTime(timestamp) + toIntervalMinute(5);

CREATE TABLE continuous_debug_session.otel_traces
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
TTL toDateTime(Timestamp) + toIntervalMinute(5);

CREATE TABLE continuous_debug_session.otel_logs
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
TTL toDateTime(Timestamp) + toIntervalMinute(5);
```

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
