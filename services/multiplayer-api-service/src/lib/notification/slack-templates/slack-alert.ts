import type {
  SectionBlock,
  ActionsBlock,
  MessageAttachment,
} from '@slack/web-api'
import { describeAlert, type AlertContent, type AlertData } from '../alert-content'
import { toSlackButtons } from './slack-buttons'

const COLORS: Record<AlertContent['tone'], string> = {
  error: '#E01E5A',
  success: '#36a64f',
}

// Slack mrkdwn treats &, < and > as markup: error messages are text, never links or mentions
const escapeText = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const renderFact = ({ name, value, url }: AlertContent['facts'][number]) => (
  `*${escapeText(name)}* ${url ? `<${url}|${escapeText(value)}>` : escapeText(value)}`
)

// Slack rendering of the shared alert description (see alert-content.ts)
export const buildSlackAlert = (event: string) => (
  params: AlertData,
): { blocks: SectionBlock[], attachments: MessageAttachment[], plainText: string } => {
  const content = describeAlert(event, params)
  const title = `*${escapeText(content.title)}*`

  const attachmentBlocks: (SectionBlock | ActionsBlock)[] = [{
    type: 'section',
    text: { type: 'mrkdwn', text: content.summary ? `${title}\n_${escapeText(content.summary)}_` : title },
  }]

  // Slack rejects a section without text
  if (content.facts.length) {
    attachmentBlocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: content.facts.map(renderFact).join('\n') },
    })
  }

  const buttons = toSlackButtons(content.links)
  if (buttons.length) {
    attachmentBlocks.push({ type: 'actions', elements: buttons })
  }

  return {
    blocks: [{ type: 'section', text: { type: 'mrkdwn', text: escapeText(content.headline) } }],
    attachments: [{ color: COLORS[content.tone], fallback: content.title, blocks: attachmentBlocks }],
    plainText: content.headline,
  }
}
