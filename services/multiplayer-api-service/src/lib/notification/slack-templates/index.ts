import { AlertRuleConditionType } from '@multiplayer/types'
import type { SectionBlock, MessageAttachment } from '@slack/web-api'
import { buildSlackAlert } from './slack-alert'

const templates = Object.fromEntries(
  Object.values(AlertRuleConditionType).map(type => [type, buildSlackAlert(type)]),
) as Record<string, ReturnType<typeof buildSlackAlert>>

export const buildSlackTemplate = (
  type: string,
  params: any,
): { blocks?: SectionBlock[], attachments?: MessageAttachment[], plainText: string } => {
  if (!templates[type]) {
    throw new Error(`ERR_TEMPLATE_NOT_FOUND "${type}"`)
  }

  return templates[type](params)
}
