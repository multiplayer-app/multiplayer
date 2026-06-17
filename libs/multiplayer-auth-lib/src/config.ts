export const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN as string
export const COOKIE_SECRET = process.env.COOKIE_SECRET as string
export const COOKIE_NAME = process.env.COOKIE_NAME || 'Multiplayer_SID'
export const COOKIE_MAX_AGE = process.env.COOKIE_MAX_AGE || 168 * 60 * 60 * 1000 // 168 hours

export const NODE_ENV = process.env.NODE_ENV
export const isProduction = NODE_ENV === 'production' && !['localhost', '127.0.0.1'].includes(COOKIE_DOMAIN)

export const ACCESS_CONTEXT_KEY_PREFIX = 'access_context:'
export const ACCESS_CONTEXT_TTL = process.env.ACCESS_CONTEXT_TTL
  ? Number(process.env.ACCESS_CONTEXT_TTL)
  : 60 * 2 // 2 minutes

export const PLATFORM_ENV = process.env.PLATFORM_ENV

export const REDIS_WORKSPACE_FEATURE_KEY_PREFIX = 'workspace_feature:'
export const REDIS_WORKSPACE_FEATURE_TTL = process.env.REDIS_WORKSPACE_FEATURE_TTL
  ? Number(process.env.REDIS_WORKSPACE_FEATURE_TTL)
  : 5 // 5 sconds

export const REDIS_ACCESS_PREFIX = 'acccess:'
export const REDIS_ACCESS_PREFIX_TTL = process.env.REDIS_ACCESS_PREFIX_TTL
  ? Number(process.env.REDIS_ACCESS_PREFIX_TTL)
  : 3 // 3 sconds

export const REDIS_USER_KEY_PREFIX = 'user:'
export const REDIS_USER_TTL = process.env.REDIS_USER_TTL
  ? Number(process.env.REDIS_USER_TTL)
  : 3 // 3 sconds

export const REDIS_INTEGRATION_KEY_PREFIX = 'integration:'
export const REDIS_INTEGRATION_TTL = process.env.REDIS_INTEGRATION_TTL
  ? Number(process.env.REDIS_INTEGRATION_TTL)
  : 3 // 3 sconds

export const REDIS_USER_SESSION_PREFIX = process.env.REDIS_USER_SESSION_PREFIX || 'user_session:'
export const REDIS_USER_SESSION_TTL = process.env.REDIS_USER_SESSION_TTL
  ? Number(process.env.REDIS_USER_SESSION_TTL)
  : 15

export const REDIS_WORKSPACE_USER_ID_KEY_PREFIX = 'workspace_user_id:'
export const REDIS_WORKSPACE_USER_ID_TTL = process.env.REDIS_WORKSPACE_USER_ID_TTL
  ? Number(process.env.REDIS_WORKSPACE_USER_ID_TTL)
  : 4 // 4 sconds

export const AUTH_HEADER_NAME = (process.env.AUTH_HEADER_NAME || 'x-api-key').toLowerCase()
export const OAUTH_HEADER_NAME = (process.env.OAUTH_HEADER_NAME || 'Authorization').toLowerCase()
export const CURRENT_USER_HEADER_NAME = (process.env.CURRENT_USER_HEADER_NAME || 'x-multiplayer-user').toLowerCase()

export const INTEGRATION_JWT_SECRET = process.env.INTEGRATION_JWT_SECRET || 'sample_jwt_secret'
