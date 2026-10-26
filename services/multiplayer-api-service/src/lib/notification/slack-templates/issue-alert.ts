import type {
  SectionBlock,
  ActionsBlock,
  MessageAttachment,
  Button,
} from '@slack/web-api'
import { describeAlert, type AlertData } from '../alert-content'

// Slack rendering of the shared alert description (see alert-content.ts)
export const buildSlackAlert = (event: string) => (
  params: AlertData,
): { blocks: SectionBlock[], attachments: MessageAttachment[], plainText: string } => {
  const content = describeAlert(event, params)

  const attachmentBlocks: (SectionBlock | ActionsBlock)[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: content.summary ? `*${content.title}*\n_${content.summary}_` : `*${content.title}*` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: content.facts.map(({ name, value }) => `*${name}* ${value}`).join('\n') },
    },
  ]

  if (content.links.length) {
    attachmentBlocks.push({
      type: 'actions',
      elements: content.links.map(({ title, url }): Button => ({
        type: 'button',
        text: { type: 'plain_text', text: title, emoji: true },
        url,
      })),
    })
  }

  return {
    blocks: [{ type: 'section', text: { type: 'mrkdwn', text: content.headline } }],
    attachments: [{ color: '#E01E5A', fallback: content.title, blocks: attachmentBlocks }],
    plainText: content.headline,
  }
}
