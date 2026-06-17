export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const PORT = process.env.PORT || '3000'
export const API_PREFIX = process.env.API_PREFIX || '/v0/auth'
export const API_DOMAIN = process.env.API_DOMAIN || 'localhost'
export const API_PROTOCOL = process.env.API_PROTOCOL || 'https'
export const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'localhost'
export const FRONTEND_PROTOCOL = process.env.FRONTEND_PROTOCOL || 'https'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID as string || '{{GITHUB_CLIENT_ID}}'
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET as string || '{{GITHUB_CLIENT_SECRET}}'
export const GITLAB_APP_ID = process.env.GITLAB_APP_ID as string || '{{GITLAB_APP_ID}}'
export const GITLAB_APP_SECRET = process.env.GITLAB_APP_SECRET as string || '{{GITLAB_APP_SECRET}}'
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string || '{{GOOGLE_CLIENT_ID}}'
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string || '{{GOOGLE_CLIENT_SECRET}}'

export const AMQP_NOTIFICATION_QUEUE = process.env.AMQP_NOTIFICATION_QUEUE || 'notification'

export const INTERNAL_API_SERVICE_URL = process.env.INTERNAL_API_SERVICE_URL || 'http://localhost:3001/internal/v0/api'

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
