export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10
export const DEFAULT_USER_TIMEZONE = process.env.DEFAULT_USER_TIMEZONE || 'America/New_York'

export const SKIP = 0
export const LIMIT = process.env.DEFAULT_MONGO_PAGE_SIZE
  ? parseInt(process.env.DEFAULT_MONGO_PAGE_SIZE, 10)
  : 30
