export const PORT = process.env.PORT || '3000'
export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const API_PREFIX = process.env.API_PREFIX || '/v0/api'
export const API_DOMAIN = process.env.API_DOMAIN || 'localhost'
export const API_PROTOCOL = process.env.API_PROTOCOL || 'https'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'

export const AWS_REGION = process.env.AWS_REGION as string || 'us-east-1'

export const S3_PUBLIC_BUCKET = process.env.S3_PUBLIC_BUCKET || 'public-bucket'
export const S3_PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET || 'private-bucket'

export const INTERNAL_COLLABORATION_SERVICE_URI = process.env.INTERNAL_COLLABORATION_SERVICE_URI || 'http://localhost:3002/internal/v0/collaboration'

export const MARKETING_EMAIL = process.env.MARKETING_EMAIL || 'hello@multiplayer.app'
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@multiplayer.app'

export const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@multiplayer.app'
export const POSTMARK_API_TOKEN = process.env.POSTMARK_API_TOKEN as string || '{{POSTMARK_API_TOKEN}}'
export const SPARKPOST_API_TOKEN = process.env.SPARKPOST_API_TOKEN as string
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string
export const MANDRILL_API_KEY = process.env.SENDGRID_API_KEY as string

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

export const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD as string
export const OPENSEARCH_LOGIN = process.env.OPENSEARCH_LOGIN as string
export const OPENSEARCH_URI = process.env.OPENSEARCH_URI as string || 'http://localhost:9200'
export const NUM_OF_SHARDS = Number.parseInt(process.env.NUM_OF_SHARDS || '1')
export const NUM_OF_REPLICAS = Number.parseInt(process.env.NUM_OF_REPLICAS || '1')

export const AMQP_AI_EVENT_QUEUE = process.env.AMQP_AI_EVENT_QUEUE || 'ai-event'
export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'
export const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1'
export const DEFAULT_MODEL_NAME = process.env.DEFAULT_MODEL_NAME || 'openai/gpt-4o-mini'
export const MULTIPLAYER_BASE_API_URL = process.env.MULTIPLAYER_BASE_API_URL || 'https://api.multiplayer.app'
export const MULTIPLAYER_CLIENT_DOMAIN = process.env.MULTIPLAYER_CLIENT_DOMAIN || 'https://go.multiplayer.app'

export const DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD = process.env.DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD
  ? Number(process.env.DEFAULT_AGENT_FIXABILITY_SCORE_THRESHOLD)
  : 10

// Sub-path each merged domain is mounted at, since these are used to build
// external OAuth callback/webhook URLs - not just internal routing.
export const GIT_API_PREFIX = `${API_PREFIX}/git`
export const AUTH_API_PREFIX = `${API_PREFIX}/auth`

export const GIT_GITHUB_CLIENT_ID = process.env.GIT_GITHUB_CLIENT_ID as string || '{{GIT_GITHUB_CLIENT_ID}}'
export const GIT_GITHUB_CLIENT_SECRET = process.env.GIT_GITHUB_CLIENT_SECRET as string || '{{GIT_GITHUB_CLIENT_SECRET}}'

export const GIT_GITLAB_APP_ID = process.env.GIT_GITLAB_APP_ID as string || '{{GIT_GITLAB_APP_ID}}'
export const GIT_GITLAB_APP_SECRET = process.env.GIT_GITLAB_APP_SECRET as string || '{{GIT_GITLAB_APP_SECRET}}'
export const GIT_GITLAB_ACCESS_TOKEN = process.env.GIT_GITLAB_ACCESS_TOKEN as string || '{{GIT_GITLAB_ACCESS_TOKEN}}'

export const GIT_BITBUCKET_CLIENT_ID = process.env.GIT_BITBUCKET_CLIENT_ID as string || '{{GIT_BITBUCKET_CLIENT_ID}}'
export const GIT_BITBUCKET_CLIENT_SECRET = process.env.GIT_BITBUCKET_CLIENT_SECRET as string || '{{GIT_BITBUCKET_CLIENT_SECRET}}'

export const GIT_GITHUB_APP_ID = process.env.GIT_GITHUB_APP_ID as string || 12345678
export const GIT_GITHUB_APP_CLIENT_ID = process.env.GIT_GITHUB_APP_CLIENT_ID as string || '{{GIT_GITHUB_APP_CLIENT_ID}}'
export const GIT_GITHUB_APP_CLIENT_SECRET = process.env.GIT_GITHUB_APP_CLIENT_SECRET as string || '{{GIT_GITHUB_APP_CLIENT_SECRET}}'
export const GIT_GITHUB_APP_WEBHOOK_SECRET = process.env.GIT_GITHUB_APP_WEBHOOK_SECRET as string || '{{GIT_GITHUB_APP_WEBHOOK_SECRET}}'
export const GIT_GITHUB_APP_PRIVATE_KEY = process.env.GIT_GITHUB_APP_PRIVATE_KEY
  ? (process.env.GIT_GITHUB_APP_PRIVATE_KEY as string).replace(/\\n/g, '\n')
  : '{{GIT_GITHUB_APP_PRIVATE_KEY}}'

export const ATLASSIAN_APP_ID = process.env.ATLASSIAN_APP_ID as string || '{{ATLASSIAN_APP_ID}}'
export const ATLASSIAN_APP_SECRET = process.env.ATLASSIAN_APP_SECRET as string || '{{ATLASSIAN_APP_SECRET}}'

export const LINEAR_APP_ID = process.env.LINEAR_APP_ID as string || '{{LINEAR_APP_ID}}'
export const LINEAR_APP_SECRET = process.env.LINEAR_APP_SECRET as string || '{{LINEAR_APP_SECRET}}'

export const REDIS_OTEL_INTEGRATION_STATUS_PREFIX = process.env.REDIS_OTEL_INTEGRATION_STATUS_PREFIX || 'otel_integration_state:'
export const REDIS_OTEL_INTEGRATION_STATUS_TTL = process.env.REDIS_OTEL_INTEGRATION_STATUS_TTL
  ? Number(process.env.REDIS_OTEL_INTEGRATION_STATUS_TTL)
  : 3 * 60

export const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '{{SLACK_CLIENT_ID}}'
export const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '{{SLACK_CLIENT_SECRET}}'
export const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '{{SLACK_SIGNING_SECRET}}'

export const isProduction = process.env.NODE_ENV === 'production'
  && ['localhost', '127.0.0.1'].some(domain => (process.env.COOKIE_DOMAIN || '').includes(domain))

export const KAFKA_ENTITY_UPDATES_TOPIC = process.env.KAFKA_ENTITY_UPDATES_TOPIC || 'entity_updates'
export const COMMIT_TIMEOUT_INTERVAL_MS = Number.parseInt(process.env.COMMIT_TIMEOUT_INTERVAL_MS || '60000')

// auth
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID as string || '{{GITHUB_CLIENT_ID}}'
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET as string || '{{GITHUB_CLIENT_SECRET}}'
export const GITLAB_APP_ID = process.env.GITLAB_APP_ID as string || '{{GITLAB_APP_ID}}'
export const GITLAB_APP_SECRET = process.env.GITLAB_APP_SECRET as string || '{{GITLAB_APP_SECRET}}'

export const REDIS_USER_LOGIN_ATTEMPTS_PREFIX = process.env.REDIS_USER_LOGIN_ATTEMPTS_PREFIX || 'user_login_attempts:'
export const REDIS_USER_LOGIN_ATTEMPTS_TTL = process.env.REDIS_USER_LOGIN_ATTEMPTS_TTL
  ? Number(process.env.REDIS_USER_LOGIN_ATTEMPTS_TTL)
  : 120

export const REDIS_BLOCKED_USER_PREFIX = process.env.REDIS_BLOCKED_USER_PREFIX || 'blocked_user:'
export const REDIS_BLOCKED_USER_TTL = process.env.REDIS_BLOCKED_USER_TTL
  ? Number(process.env.REDIS_BLOCKED_USER_TTL)
  : 600

export const MAX_USER_LOGIN_ATTEMPTS = Number(process.env.MAX_USER_LOGIN_ATTEMPTS) || 5

export const OAUTH_JWT_SECRET = process.env.OAUTH_JWT_SECRET || 'sample_oauth_jwt_secret'
export const OAUTH_ACCESS_TOKEN_EXPIRATION_SECONDS = 3600 // 1 hour
export const OAUTH_REFRESH_TOKEN_EXPIRATION_SECONDS = 3600 * 24 * 60 // 60 days
export const OAUTH_CLIENT_SECRET_EXPIRATION_SECONDS = 60 * 60 * 24 * 90 // 90 days
