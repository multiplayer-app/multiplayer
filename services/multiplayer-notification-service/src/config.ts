export const AMQP_LISTEN_QUEUE = process.env.AMQP_LISTEN_QUEUE || 'notification'
export const PORT = process.env.PORT || '3000'
export const CORS_DOMAIN = process.env.CORS_DOMAIN || '*'
export const API_PREFIX = process.env.API_PREFIX || '/v0/notification'
export const SWAGGER_ENABLED = (process.env.SWAGGER_ENABLED || 'false') === 'true'
export const FRONTEND_DOMAIN = process.env.FRONTEND_DOMAIN || 'localhost'
export const FRONTEND_PROTOCOL = process.env.FRONTEND_PROTOCOL || 'https'
export const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@multiplayer.app'

export const POSTMARK_API_TOKEN = process.env.POSTMARK_API_TOKEN as string || '{{POSTMARK_API_TOKEN}}'
export const SPARKPOST_API_TOKEN = process.env.SPARKPOST_API_TOKEN as string
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string
export const MANDRILL_API_KEY = process.env.SENDGRID_API_KEY as string
