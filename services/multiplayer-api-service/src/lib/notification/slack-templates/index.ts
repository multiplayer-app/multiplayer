import { AlertRuleConditionType } from '@multiplayer/types'
import type { SectionBlock, MessageAttachment } from '@slack/web-api'
import { default as newIssueCreated } from './new-issue-created'
import { default as numberOfSpansGreaterThan } from './number-of-spans-greater-than'
import { default as sessionRecordingCreated } from './session-recording-created'
import { default as debuggingAgentFixPushed } from './debugging-agent-fix-pushed'

const templates = {
  [AlertRuleConditionType.NEW_ISSUE_CREATED]: newIssueCreated,
  [AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN]: numberOfSpansGreaterThan,
  [AlertRuleConditionType.SESSION_RECORDING_CREATED]: sessionRecordingCreated,
  [AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED]: debuggingAgentFixPushed,
}

export const buildSlackTemplate = (
  type: string,
  params: any,
): { blocks?: SectionBlock[], attachments?: MessageAttachment[], plainText: string } => {
  if (!templates[type]) {
    throw new Error(`ERR_TEMPLATE_NOT_FOUND "${type}"`)
  }

  return templates[type](params)
}
