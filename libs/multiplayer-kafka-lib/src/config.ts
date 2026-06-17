export const SERVICE_NAME = process.env.npm_package_name
export const KAFKA_URI = (process.env.KAFKA_URI as string || 'localhost:29092').split(',')
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID as string || SERVICE_NAME
export const KAFKA_SESSION_TIMEOUT = Number.parseInt(process.env.KAFKA_SESSION_TIMEOUT || '30000')
