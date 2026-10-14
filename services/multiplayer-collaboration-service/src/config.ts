export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const COOKIE_NAME = process.env.COOKIE_NAME || 'Multiplayer_SID'
export const PORT = process.env.PORT || '3000'
export const API_PROTOCOL = process.env.API_PROTOCOL || 'http'
export const API_PREFIX = process.env.API_PREFIX || '/v0/collaboration'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'

export const AMQP_COLLABORATION_EVENT_QUEUE = process.env.AMQP_COLLABORATION_EVENT_QUEUE || 'collaboration-event'
export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'

export const API_SERVICE_URI = process.env.API_SERVICE_URI || 'http://localhost:3001/v0/api'
export const INTERNAL_API_SERVICE_URI = process.env.INTERNAL_API_SERVICE_URI || 'http://localhost:3001/internal/v0/api'

export const ENTITY_UPDATES_TOPIC = process.env.ENTITY_UPDATES_TOPIC || 'entity_updates'
export const KAFKA_SESSION_NOTES_UPDATE_TOPIC = process.env.KAFKA_SESSION_NOTES_UPDATE_TOPIC || 'session_notes_updates'
export const WS_ADAPTER_KEY = `ws-${process.env.npm_package_name}-${process.env.NODE_ENV || 'dev'}`
