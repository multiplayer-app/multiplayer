export const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379'

export const REDIS_DB = process.env.REDIS_DB || 0

export const isLocalEnv = process.env.PLATFORM_ENV === 'local'
