import * as fs from 'fs'

const PackageJson = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, 'utf-8'))

export const SERVICE_NAME = PackageJson.name.split('/').pop()
export const PORT = process.env.PORT || '3000'
export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const API_PREFIX = process.env.API_PREFIX || '/v0/version'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'

export const S3_PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET || 'private-bucket'

export const DEFAULT_PAGINATION_LIMIT = 50
export const DEFAULT_PAGINATION_OFFSET = 0

export const AMQP_NOTIFICATION_QUEUE = process.env.AMQP_NOTIFICATION_QUEUE || 'notification'
export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'
export const AMQP_FORK_QUEUE = process.env.AMQP_FORK_QUEUE || 'fork'
export const AMQP_CLEANUP_QUEUE = process.env.AMQP_CLEANUP_QUEUE || 'cleanup'
export const AMQP_COLLABORATION_RPC_QUEUE = process.env.AMQP_COLLABORATION_RPC_QUEUE || 'collaboration-rpc'

export const API_SERVICE_URL = process.env.API_SERVICE_URL || 'http://localhost:3001/v0/api'

export const KAFKA_ENTITY_UPDATES_TOPIC = process.env.KAFKA_ENTITY_UPDATES_TOPIC || 'entity_updates'
export const COMMIT_TIMEOUT_INTERVAL_MS = Number.parseInt(process.env.COMMIT_TIMEOUT_INTERVAL_MS || '60000')

export const INTEGRATION_JWT_SECRET = process.env.INTEGRATION_JWT_SECRET || 'sample_jwt_secret'
