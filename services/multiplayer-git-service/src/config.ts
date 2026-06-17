export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const PORT = process.env.PORT || '3000'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'

export const API_PREFIX = process.env.API_PREFIX || '/v0/git'
export const API_DOMAIN = process.env.API_DOMAIN || 'localhost'
export const API_PROTOCOL = process.env.API_PROTOCOL || 'https'

export const DEFAULT_SKIP = 0
export const DEFAULT_LIMIT = 30

export const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'localhost'
export const FRONTEND_PROTOCOL = process.env.FRONTEND_PROTOCOL || 'https'

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

export const AMQP_EVENT_QUEUE = process.env.AMQP_EVENT_QUEUE || 'event'
export const AMQP_INTEGRATION_EVENT_QUEUE = process.env.AMQP_INTEGRATION_EVENT_QUEUE || 'integration-event'
export const AMQP_NOTIFICATION_QUEUE = process.env.AMQP_NOTIFICATION_QUEUE || 'notification'

export const INTEGRATION_JWT_SECRET = process.env.INTEGRATION_JWT_SECRET || 'sample_jwt_secret'

export const REDIS_OAUTH_STATE_PREFIX = process.env.REDIS_OAUTH_STATE_PREFIX || 'oauth_state:'
export const REDIS_OAUTH_STATE_TTL = process.env.REDIS_OAUTH_STATE_TTL
  ? Number(process.env.REDIS_OAUTH_STATE_TTL)
  : 180


export const REDIS_OTEL_INTEGRATION_STATUS_PREFIX = process.env.REDIS_OTEL_INTEGRATION_STATUS_PREFIX || 'otel_integration_state:'
export const REDIS_OTEL_INTEGRATION_STATUS_TTL = process.env.REDIS_OTEL_INTEGRATION_STATUS_TTL
  ? Number(process.env.REDIS_OTEL_INTEGRATION_STATUS_TTL)
  : 3 * 60

export const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '{{SLACK_CLIENT_ID}}'
export const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '{{SLACK_CLIENT_SECRET}}'
export const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '{{SLACK_SIGNING_SECRET}}'

export const isProduction = process.env.NODE_ENV === 'production'
  && ['localhost', '127.0.0.1'].some(domain => (process.env.COOKIE_DOMAIN || '').includes(domain))
