import type { Button } from '@slack/web-api'

// Slack rejects the whole message when a button URL exceeds 3000 characters or a label 75
const MAX_BUTTON_URL_LENGTH = 3000
const MAX_BUTTON_TEXT_LENGTH = 75

export const toSlackButtons = (links: { title: string, url: string }[]): Button[] => links
  .filter(({ url }) => url.length <= MAX_BUTTON_URL_LENGTH)
  .map(({ title, url }) => ({
    type: 'button',
    text: { type: 'plain_text', text: title.slice(0, MAX_BUTTON_TEXT_LENGTH), emoji: true },
    url,
  }))
