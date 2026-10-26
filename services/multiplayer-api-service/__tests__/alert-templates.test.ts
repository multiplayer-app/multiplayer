import { AlertRuleConditionType } from '@multiplayer/types'
import { buildSlackTemplate } from '../src/lib/notification/slack-templates'

const issue = {
  workspace: '6491c2e98a1a2213633434bc',
  project: '65109c67d4abb818be2e497d',
  title: 'Order service unavailable',
  titleHash: 'title-hash',
  componentHash: 'component-hash',
  metadata: { message: 'order service unavailable' },
  service: { serviceName: 'checkout', environment: 'production', release: '1.0.0' },
} as any

// State-change alerts are raised by a user, so they carry no span
const occurrenceSpan = {
  SpanKind: 1,
  SpanAttributes: { 'http.request.method': 'POST', 'http.route': '/orders' },
  Events: [],
} as any

describe('Slack issue alert templates', () => {
  it.each([
    AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN,
    AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED,
    AlertRuleConditionType.ISSUE_UNARCHIVED,
    AlertRuleConditionType.NEW_ISSUE_SEVERITY_MARKED_AS_HIGH,
    AlertRuleConditionType.EXISTING_ISSUE_SEVERITY_MARKED_AS_HIGH,
  ])('renders %s with and without a span', (type) => {
    for (const span of [undefined, occurrenceSpan]) {
      const message = buildSlackTemplate(type, { issue, span, affectedEndUsersCount: 3, interval: '1h' })
      const rendered = JSON.stringify(message.attachments)

      expect(message.plainText).toBeTruthy()
      expect(rendered).toContain('Order service unavailable')
      expect(rendered).toContain('checkout')
    }
  })

  it('reads the endpoint from stable HTTP semantic conventions', () => {
    const message = buildSlackTemplate(AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED, { issue, span: occurrenceSpan })

    expect(JSON.stringify(message.attachments)).toContain('POST /orders')
    expect(message.plainText).toBe('Resolved issue occurred again')
  })
})
