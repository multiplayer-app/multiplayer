import { describeAlert, type AlertContent } from './alert-content'
import { assertAllowedHost, postWithRetries } from './safe-request'

// Microsoft Teams alerts are posted as Adaptive Cards to a Teams "Workflows" webhook (the
// Power Automate replacement for the retired Office 365 connectors). On top of the SSRF guard,
// only Microsoft's webhook hosts are accepted.
const TEAMS_WEBHOOK_HOSTS = [
  /\.logic\.azure\.com$/i,
  /\.api\.powerplatform\.com$/i,
  /\.webhook\.office\.com$/i,
]

export const isTeamsWebhookHost = (hostname: string) => TEAMS_WEBHOOK_HOSTS.some(pattern => pattern.test(hostname))

// Teams shows at most 6 actions on a card; the first links (the issue, then trace links in their
// configured order) are the ones kept
const MAX_CARD_ACTIONS = 6

export const buildTeamsCard = (content: AlertContent) => ({
  type: 'message',
  attachments: [{
    contentType: 'application/vnd.microsoft.card.adaptive',
    contentUrl: null,
    content: {
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      type: 'AdaptiveCard',
      version: '1.4',
      body: [
        {
          type: 'TextBlock',
          text: content.headline,
          weight: 'Bolder',
          size: 'Medium',
          color: content.tone === 'success' ? 'Good' : 'Attention',
          wrap: true,
        },
        { type: 'TextBlock', text: content.title, weight: 'Bolder', wrap: true },
        ...content.summary ? [{ type: 'TextBlock', text: content.summary, isSubtle: true, wrap: true }] : [],
        { type: 'FactSet', facts: content.facts.map(({ name, value }) => ({ title: name, value })) },
      ],
      actions: content.links
        .slice(0, MAX_CARD_ACTIONS)
        .map(({ title, url }) => ({ type: 'Action.OpenUrl', title, url })),
    },
  }],
})

export const sendTeamsNotification = async (
  { webhookUrl }: { webhookUrl: string },
  event: string,
  data: any,
) => {
  assertAllowedHost(webhookUrl, isTeamsWebhookHost, 'Microsoft Teams Workflows webhook')

  const body = JSON.stringify(buildTeamsCard(describeAlert(event, data)))

  await postWithRetries(webhookUrl, () => ({
    body,
    headers: { 'Content-Type': 'application/json' },
  }))
}
