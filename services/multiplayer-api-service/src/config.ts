export const PORT = process.env.PORT || '3000'
export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const API_PREFIX = process.env.API_PREFIX || '/v0/api'
export const API_DOMAIN = process.env.API_DOMAIN || 'localhost'
export const API_PROTOCOL = process.env.API_PROTOCOL || 'https'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'

export const S3_PUBLIC_BUCKET = process.env.S3_PUBLIC_BUCKET || 'public-bucket'
export const S3_PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET || 'private-bucket'

export const AMQP_NOTIFICATION_QUEUE = process.env.AMQP_NOTIFICATION_QUEUE || 'notification'
export const AMQP_FORK_QUEUE = process.env.AMQP_FORK_QUEUE || 'fork'
export const AMQP_CLEANUP_QUEUE = process.env.AMQP_CLEANUP_QUEUE || 'cleanup'

export const MARKETING_EMAIL = process.env.MARKETING_EMAIL || 'hello@multiplayer.app'
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@multiplayer.app'

export const DEFAULT_PAGINATION_LIMIT = 50
export const DEFAULT_PAGINATION_OFFSET = 0

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string

export const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'localhost'
export const FRONTEND_PROTOCOL = process.env.FRONTEND_PROTOCOL || 'https'

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '{{OPENAI_API_KEY}}'
export const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID || '{{OPENAI_API_KEY}}'

export const AI_REQUEST_LIMIT = Number(process.env.AI_REQUEST_LIMIT || 100)

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY as string
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
export const STRIPE_TRIAL_PERIOD_DAYS = 7
// export const STRIPE_GRACE_PERIOD_DAYS = 7
// export const STRIPE_DEFAULT_FREE_PRICE_ID = process.env.STRIPE_DEFAULT_FREE_PRICE_ID as string
// export const STRIPE_PRO_PRODUCT_ID = process.env.STRIPE_PRO_PRODUCT_ID as string
// export const STRIPE_FREE_PRODUCT_ID = process.env.STRIPE_FREE_PRODUCT_ID as string
export const STRIPE_DEFAULT_PRICE_ID = process.env.STRIPE_DEFAULT_PRICE_ID as string
export const STRIPE_DISABLED = !STRIPE_SECRET_KEY || !STRIPE_PUBLISHABLE_KEY || !STRIPE_WEBHOOK_SECRET || !STRIPE_DEFAULT_PRICE_ID

export const INTEGRATION_JWT_SECRET = process.env.INTEGRATION_JWT_SECRET || 'sample_jwt_secret'

export const REDIS_OAUTH_STATE_PREFIX = process.env.REDIS_OAUTH_STATE_PREFIX || 'oauth_state:'
export const REDIS_OAUTH_STATE_TTL = process.env.REDIS_OAUTH_STATE_TTL
  ? Number(process.env.REDIS_OAUTH_STATE_TTL)
  : 180

export const AWS_REGION = process.env.AWS_REGION as string || 'us-east-1'
export const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD as string
export const OPENSEARCH_LOGIN = process.env.OPENSEARCH_LOGIN as string

export const OPENSEARCH_URI = process.env.OPENSEARCH_URI as string || 'http://localhost:9200'
export const NUM_OF_SHARDS = Number.parseInt(process.env.NUM_OF_SHARDS || '1')
export const NUM_OF_REPLICAS = Number.parseInt(process.env.NUM_OF_REPLICAS || '1')

export const AMQP_AI_EVENT_QUEUE = process.env.AMQP_AI_EVENT_QUEUE || 'ai-event'
export const INTERNAL_VERSION_SERVICE_URI = process.env.INTERNAL_VERSION_SERVICE_URI || 'http://localhost:3006/internal/v0/version'
export const INTERNAL_GIT_SERVICE_URI = process.env.INTERNAL_GIT_SERVICE_URI || 'http://localhost:3007/internal/v0/git'
export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'
export const DEFAULT_MODEL_NAME = process.env.DEFAULT_MODEL_NAME || 'openai/gpt-4o-mini'
export const MULTIPLAYER_BASE_API_URL = process.env.MULTIPLAYER_BASE_API_URL || 'https://api.multiplayer.app'
export const MULTIPLAYER_CLIENT_DOMAIN = process.env.MULTIPLAYER_CLIENT_DOMAIN || 'https://go.multiplayer.app'

export const DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD = process.env.DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD
  ? Number(process.env.DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD)
  : 10
