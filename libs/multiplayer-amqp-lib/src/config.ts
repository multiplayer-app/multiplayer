export const SERVICE_NAME = process.env.npm_package_name
export const AMQP_RPC_TIMEOUT = Number(process.env.AMQP_RPC_TIMEOUT) || 5000
export const AMQP_RECONNECT_INTERVAL = Number(process.env.AMQP_RECONNECT_INTERVAL) || 2500
export const AMQP_RECONNECT_MAX_OFFSET = Number(process.env.AMQP_RECONNECT_MAX_OFFSET) || 50
export const AMQP_URI = process.env.AMQP_URI || 'amqp://localhost:5672'
