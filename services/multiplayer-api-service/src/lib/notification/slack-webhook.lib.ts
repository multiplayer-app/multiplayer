import { buildSlackTemplate } from './slack-templates'
import { assertAllowedHost, postWithRetries } from './safe-request'

// Slack incoming webhooks: an alert posted to the channel the webhook was created for, without a
// Slack app integration. The URL is the credential.
const SLACK_WEBHOOK_HOSTS = ['hooks.slack.com', 'hooks.slack-gov.com']

export const isSlackWebhookHost = (hostname: string) => SLACK_WEBHOOK_HOSTS.includes(hostname.toLowerCase())

export const sendSlackWebhookNotification = async (
  { webhookUrl }: { webhookUrl: string },
  template: string,
  data: any,
) => {
  assertAllowedHost(webhookUrl, isSlackWebhookHost, 'Slack incoming webhook')

  // Same message as the Slack app sends; incoming webhooks take the same payload fields
  const message = buildSlackTemplate(template, data)
  const body = JSON.stringify({
    text: message.plainText,
    ...(message.blocks?.length ? { blocks: message.blocks } : {}),
    ...(message.attachments?.length ? { attachments: message.attachments } : {}),
  })

  await postWithRetries(webhookUrl, () => ({
    body,
    headers: { 'Content-Type': 'application/json' },
  }))
}
