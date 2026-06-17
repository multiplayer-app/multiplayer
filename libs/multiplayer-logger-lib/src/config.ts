export const NODE_ENV = process.env.NODE_ENV || 'development'
export const isProduction = NODE_ENV === 'production'
export const APP_NAME = process.env.npm_package_name?.split('/').pop() as string || 'tests'
export const LOG_LEVEL = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')
