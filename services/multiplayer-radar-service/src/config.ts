export const PORT = process.env.PORT || '3000'
export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const API_PREFIX = process.env.API_PREFIX || '/v0/radar'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'

export const AMQP_RADAR_DETECTION_APPLY_QUEUE = process.env.AMQP_RADAR_DETECTION_APPLY_QUEUE || 'radar-detection-apply'
export const AMQP_COLLABORATION_RPC_QUEUE = process.env.AMQP_COLLABORATION_RPC_QUEUE || 'collaboration-rpc'
export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'
export const AMQP_RADAR_EVENT_QUEUE = process.env.AMQP_RADAR_EVENT_QUEUE || 'radar-event'
export const AMQP_DEBUG_SESSION_MOVE_S3_QUEUE = process.env.AMQP_DEBUG_SESSION_MOVE_S3_QUEUE || 'debug-session-move-s3'
export const AMQP_NOTIFICATION_QUEUE = process.env.AMQP_NOTIFICATION_QUEUE || 'notification'


export const CLICKHOUSE_OTEL_DB = process.env.CLICKHOUSE_OTEL_DB || 'otel'
export const CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME = process.env.CLICKHOUSE_OTEL_METRICS_GAUGE_TABLE_NAME || 'otel_metrics_gauge'
// export const CLICKHOUSE_OTEL_TRACES_NAME = process.env.CLICKHOUSE_OTEL_TRACES_NAME || 'otel_traces'

export const CLICKHOUSE_RADAR_DB = process.env.CLICKHOUSE_RADAR_DB || 'radar'
export const CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME = process.env.CLICKHOUSE_RADAR_DETECTIONS_TABLE_NAME || 'detections'
export const CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME = process.env.CLICKHOUSE_RADAR_DETECTION_PARAMS_TABLE_NAME || 'detection_params'
export const CLICKHOUSE_RADAR_FLOWS_TABLE_NAME = process.env.CLICKHOUSE_RADAR_FLOWS_TABLE_NAME || 'flows'

export const CLICKHOUSE_DEBUG_SESSION_DB = process.env.CLICKHOUSE_DEBUG_SESSION_DB || 'debug_session'
export const CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME || 'rrweb_events'
export const CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME || 'otel_traces'
export const CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME || 'otel_logs'

export const CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_DB = process.env.CLICKHOUSE_DEBUG_SESSION_DB || 'continuous_debug_session'
export const CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_RRWEB_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_RRWEB_TABLE_NAME || 'rrweb_events'
export const CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_TRACES_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_TRACES_TABLE_NAME || 'otel_traces'
export const CLICKHOUSE_CONTINUOUS_DEBUG_SESSION_LOGS_TABLE_NAME = process.env.CLICKHOUSE_DEBUG_SESSION_LOGS_TABLE_NAME || 'otel_logs'

export const REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX = process.env.REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_PREFIX || 'auto_merge:'
export const REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_LOCK_PREFIX = process.env.REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_LOCK_PREFIX || 'auto_merge_lock:'
export const REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_TTL = process.env.REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_TTL
  ? Number(process.env.REDIS_RADAR_DETECTION_ACTIVE_AUTO_MERGE_TTL)
  : 10

export const REDIS_RELEASE_PREFIX = process.env.REDIS_RELEASE_PREFIX || 'release:'
export const REDIS_RELEASE_TTL = process.env.REDIS_RELEASE_TTL
  ? Number(process.env.REDIS_RELEASE_TTL)
  : 10

export const REDIS_CLIENT_ID_SOCKET_PREFIX = process.env.REDIS_CLIENT_ID_SOCKET_PREFIX || 'client_id_socket:'
export const REDIS_CLIENT_ID_SOCKET_TTL = process.env.REDIS_CLIENT_ID_SOCKET_TTL
  ? Number(process.env.REDIS_CLIENT_ID_SOCKET_TTL)
  : 3 * 1440 // 3 days

export const REDIS_CLIENT_ID_DEBUG_SESSION_PREFIX = process.env.REDIS_CLIENT_ID_DEBUG_SESSION_PREFIX || 'client_id_debug_session:'
export const REDIS_CLIENT_ID_DEBUG_SESSION_TTL = process.env.REDIS_CLIENT_ID_DEBUG_SESSION_TTL
  ? Number(process.env.REDIS_CLIENT_ID_DEBUG_SESSION_TTL)
  : 60

export const REDIS_DEPLOYMENT_PREFIX = process.env.REDIS_DEPLOYMENT_PREFIX || 'deployment:'
export const REDIS_DEPLOYMENT_TTL = process.env.REDIS_DEPLOYMENT_TTL
  ? Number(process.env.REDIS_DEPLOYMENT_TTL)
  : 10

export const REDIS_ISSUE_RESOLVE_LOCK_PREFIX = process.env.REDIS_ISSUE_RESOLVE_LOCK_PREFIX || 'issue_resolve_lock:'
export const REDIS_ISSUE_RESOLVE_LOCK_TTL = process.env.REDIS_ISSUE_RESOLVE_LOCK_TTL
  ? Number(process.env.REDIS_ISSUE_RESOLVE_LOCK_TTL)
  : 10


export const REDIS_SOCKET_LOCK_KEY_PREFIX = process.env.REDIS_SOCKET_LOCK_KEY_PREFIX || 'socket_check_lock'

export const REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX = process.env.REDIS_DEBUG_SESSION_SHORT_ID_CACHE_PREFIX || 'debug_session_short_id:'
export const REDIS_DEBUG_SESSION_LOCK_PREFIX = process.env.REDIS_DEBUG_SESSION_LOCK_PREFIX || 'debug_session_lock:'
export const REDIS_DEBUG_SESSION_CACHE_PREFIX = process.env.REDIS_DEBUG_SESSION_CACHE_PREFIX || 'debug_session:'
export const REDIS_DEBUG_SESSION_TTL = process.env.REDIS_DEBUG_SESSION_TTL
  ? Number(process.env.REDIS_DEBUG_SESSION_TTL)
  : 30
export const DEBUG_SESSION_MAX_DURATION_SECONDS = process.env.DEBUG_SESSION_MAX_DURATION_SECONDS
  ? Number(process.env.DEBUG_SESSION_MAX_DURATION_SECONDS)
  : 10 * 60 + 30

export const REDIS_CONTINUOUS_DEBUG_SESSION_PREFIX = process.env.REDIS_CONTINUOUS_DEBUG_SESSION_PREFIX || 'continuous_debug_session:'
// export const REDIS_CONTINUOUS_DEBUG_SESSION_TTL = process.env.REDIS_CONTINUOUS_DEBUG_SESSION_TTL
//   ? Number(process.env.REDIS_CONTINUOUS_DEBUG_SESSION_TTL)
//   : 10 * 60

export const REDIS_ENTITY_CACHE_PREFIX = process.env.REDIS_ENTITY_CACHE_PREFIX || 'entity:'
export const REDIS_ENTITY_TTL = process.env.REDIS_ENTITY_TTL
  ? Number(process.env.REDIS_ENTITY_TTL)
  : 30

export const REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_PREFIX = process.env.REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_PREFIX || 'conditional_session_recordings_filters:'
export const REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_TTL = process.env.REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_TTL
  ? Number(process.env.REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_TTL)
  : 30

export const REDIS_PROJECT_PREFIX = process.env.REDIS_PROJECT_PREFIX || 'project:'
export const REDIS_PROJECT_TTL = process.env.REDIS_PROJECT_TTL
  ? Number(process.env.REDIS_PROJECT_TTL)
  : 30

export const REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_PREFIX = process.env.REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_PREFIX || 'session_recording_issue_throttle:'
export const REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_TTL = process.env.REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_TTL
  ? Number(process.env.REDIS_SESSION_RECORDING_ISSUE_THROTTLE_CACHE_TTL)
  : 12 * 60 * 60 // 12 hours

export const REDIS_CLIENT_ID_END_USER_PREFIX = process.env.REDIS_CLIENT_ID_END_USER_PREFIX || 'client_id_end_user:'
export const REDIS_CLIENT_ID_END_USER_TTL = process.env.REDIS_CLIENT_ID_END_USER_TTL
  ? Number(process.env.REDIS_CLIENT_ID_END_USER_TTL)
  : 1 * 60 // 1 minute

export const VERSION_SERVICE_URI = process.env.VERSION_SERVICE_URI || 'http://localhost:3000/v0/version'
export const INTERNAL_VERSION_SERVICE_URI = process.env.INTERNAL_VERSION_SERVICE_URI || 'http://localhost:3000/internal/v0/version'
export const INTERNAL_GIT_SERVICE_URI = process.env.INTERNAL_GIT_SERVICE_URI || 'http://localhost:3000/internal/v0/git'

export const INTEGRATION_JWT_SECRET = process.env.INTEGRATION_JWT_SECRET || 'sample_jwt_secret'

export const KAFKA_URI = (process.env.KAFKA_URI as string || '').split(',')
export const KAFKA_CONSUME_CONCURRENT_PARTITIONS = process.env.KAFKA_CONSUME_CONCURRENT_PARTITIONS
  ? Number(process.env.KAFKA_CONSUME_CONCURRENT_PARTITIONS)
  : 3
export const KAFKA_OTEL_D0C_TRACES_TOPIC = process.env.KAFKA_OTEL_D0C_TRACES_TOPIC || 'otlp_spans_d0c'
export const KAFKA_OTEL_DEB_TRACES_TOPIC = process.env.KAFKA_OTEL_DEB_TRACES_TOPIC || 'otlp_spans_deb'
export const KAFKA_OTEL_DEB_LOGS_TOPIC = process.env.KAFKA_OTEL_DEB_LOGS_TOPIC || 'otlp_logs_deb'
export const KAFKA_OTEL_CDB_TRACES_TOPIC = process.env.KAFKA_OTEL_CDB_TRACES_TOPIC || 'otlp_spans_cdb'
export const KAFKA_OTEL_CDB_LOGS_TOPIC = process.env.KAFKA_OTEL_CDB_LOGS_TOPIC || 'otlp_logs_cdb'
export const KAFKA_OTEL_ERROR_SPAN_TOPIC = process.env.KAFKA_OTEL_ERROR_SPAN_TOPIC || 'otlp_spans_error'

export const KAFKA_SESSION_NOTES_UPDATE_TOPIC = process.env.KAFKA_SESSION_NOTES_UPDATE_TOPIC || 'session_notes_updates'

export const REDIS_OTEL_SPAN_CACHE_PREFIX = process.env.REDIS_OTEL_SPAN_CACHE_PREFIX || 'otel_span:'
export const REDIS_OTEL_SPAN_CACHE_TTL = process.env.REDIS_OTEL_SPAN_CACHE_TTL
  ? Number(process.env.REDIS_OTEL_SPAN_CACHE_TTL)
  : 10 // 10 seconds

export const REDIS_OTEL_SPAN_ID_CACHE_PREFIX = process.env.REDIS_OTEL_SPAN_ID_CACHE_PREFIX || 'otel_span_id:'
export const REDIS_OTEL_SPAN_ID_CACHE_TTL = process.env.REDIS_OTEL_SPAN_ID_CACHE_TTL
  ? Number(process.env.REDIS_OTEL_SPAN_ID_CACHE_TTL)
  : 15 // 10 seconds


export const REDIS_OTEL_FLOW_KEY_CACHE_PREFIX = process.env.REDIS_OTEL_FLOW_KEY_CACHE_PREFIX || 'flow_key:'
export const REDIS_OTEL_FLOW_DATA_CACHE_PREFIX = process.env.REDIS_OTEL_FLOW_DATA_CACHE_PREFIX || 'flow:'
export const REDIS_RADAR_FLOW_WORKER_LOCK_PREFIX = process.env.REDIS_RADAR_FLOW_WORKER_LOCK_PREFIX || 'flow_lock:'
export const REDIS_OTEL_FLOW_KEY_CACHE_TTL = process.env.REDIS_OTEL_FLOW_KEY_CACHE_TTL
  ? Number(process.env.REDIS_OTEL_FLOW_KEY_CACHE_TTL)
  : 10 // 10 seconds


export const REDIS_DETECTIONS_CACHE_PREFIX = process.env.REDIS_DETECTIONS_CACHE_PREFIX || 'detection:'
export const REDIS_DETECTIONS_CACHE_TTL = process.env.REDIS_DETECTIONS_CACHE_TTL
  ? Number(process.env.REDIS_DETECTIONS_CACHE_TTL)
  : 90

export const REDIS_OTEL_INTEGRATION_STATUS_PREFIX = process.env.REDIS_OTEL_INTEGRATION_STATUS_PREFIX || 'otel_integration_state:'
export const REDIS_OTEL_INTEGRATION_STATUS_TTL = process.env.REDIS_OTEL_INTEGRATION_STATUS_TTL
  ? Number(process.env.REDIS_OTEL_INTEGRATION_STATUS_TTL)
  : 3 * 60

export const S3_DEBUG_SESSIONS_BUCKET = process.env.S3_DEBUG_SESSIONS_BUCKET || 'debug-sessions-bucket'
export const S3_PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET || 'private-bucket'

export const ATTACHMENTS_MAX_FILE_SIZE = process.env.ATTACHMENTS_MAX_FILE_SIZE
  ? Number(process.env.ATTACHMENTS_MAX_FILE_SIZE)
  : 10 * 1024 * 1024 // 10 MB
export const ATTACHMENTS_ALLOWED_MIME_TYPES: string[] | undefined = process.env.ATTACHMENTS_ALLOWED_MIME_TYPES
  ? process.env.ATTACHMENTS_ALLOWED_MIME_TYPES.split(',')
  : undefined

export const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'localhost'
export const FRONTEND_PROTOCOL = process.env.FRONTEND_PROTOCOL || 'https'

export const CONTINUOUS_DEBUG_SESSION_MAX_DURATION_SECONDS = process.env.CONTINUOUS_DEBUG_SESSION_MAX_DURATION_SECONDS
  ? Number(process.env.CONTINUOUS_DEBUG_SESSION_MAX_DURATION_SECONDS)
  : 2 * 60 + 10

export const CONTINUOUS_DEBUG_SESSION_DEBOUNCE_SECONDS = process.env.CONTINUOUS_DEBUG_SESSION_DEBOUNCE_SECONDS
  ? Number(process.env.CONTINUOUS_DEBUG_SESSION_DEBOUNCE_SECONDS)
  : 40 + 10

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sample_api_key'
export const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID || 'sample_org_id'
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'
export const DEFAULT_MODEL_NAME = process.env.DEFAULT_MODEL_NAME || 'openai/gpt-4.1-nano'

export const MULTIPLAYER_BASE_API_URL = process.env.MULTIPLAYER_BASE_API_URL || 'https://api.multiplayer.app'

export const REDIS_ALER_RULES_CACHE_PREFIX = process.env.REDIS_ALER_RULES_CACHE_PREFIX || 'alert_rules:'
export const REDIS_ALER_RULES_CACHE_TTL = process.env.REDIS_CONDITIONAL_SESSION_RECORDINGS_FILTERS_TTL
  ? Number(process.env.REDIS_ALER_RULES_CACHE_TTL)
  : 4 * 60

export const REDIS_AGENT_SESSION_PREFIX = process.env.REDIS_AGENT_SESSION_PREFIX || 'agent_session:'
export const REDIS_AGENT_SESSION_TTL = process.env.REDIS_AGENT_SESSION_TTL
  ? Number(process.env.REDIS_AGENT_SESSION_TTL)
  : 24 * 60 * 60

export const DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD = process.env.DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD
  ? Number(process.env.DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD)
  : 70

// How long (ms) to wait for the first AI response before marking the chat as timedout.
// Defaults to 5 minutes.
export const CHAT_AI_RESPONSE_TIMEOUT_MS = process.env.CHAT_AI_RESPONSE_TIMEOUT_MS
  ? Number(process.env.CHAT_AI_RESPONSE_TIMEOUT_MS)
  : 5 * 60 * 1000

// Number of consecutive timeouts for a single agent before it is marked as errored.
export const AGENT_CONSECUTIVE_TIMEOUT_LIMIT = process.env.AGENT_CONSECUTIVE_TIMEOUT_LIMIT
  ? Number(process.env.AGENT_CONSECUTIVE_TIMEOUT_LIMIT)
  : 2
