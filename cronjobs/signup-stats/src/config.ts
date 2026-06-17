export const SLACK_OAUTH_TOKEN = process.env.SLACK_OAUTH_TOKEN as string
export const SLACK_API = process.env.SLACK_API || 'https://slack.com/api'
export const SLACK_CHANNEL = process.env.SLACK_CHANNEL as string
export const PERIOD_MS = process.env.PERIOD_MS ? Number(process.env.PERIOD_MS) : 86400000
