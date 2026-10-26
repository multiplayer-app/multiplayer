import { AlertRuleConditionType, DebugSessionCreationReasonType } from '@multiplayer/types'
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

// The attachment's blocks: the title, the facts, then the buttons
const attachmentOf = (message: ReturnType<typeof buildSlackTemplate>) => message.attachments![0] as any
const textsOf = (message: ReturnType<typeof buildSlackTemplate>) => attachmentOf(message).blocks
  .filter(({ type }) => type === 'section')
  .map(({ text }) => text.text)
const buttonsOf = (message: ReturnType<typeof buildSlackTemplate>) => attachmentOf(message).blocks
  .filter(({ type }) => type === 'actions')
  .flatMap(({ elements }) => elements.map(({ text, url }) => ({ text: text.text, url })))

describe('Slack alert rendering', () => {
  it('escapes issue content, which must not become links or mentions', () => {
    const message = buildSlackTemplate(AlertRuleConditionType.NEW_ISSUE_CREATED, {
      issue: { ...issue, title: '<!channel> & <https://evil.example|click>', metadata: { message: 'a < b' } },
      span: occurrenceSpan,
    })
    const [title, facts] = textsOf(message)

    expect(title).toBe('*&lt;!channel&gt; &amp; &lt;https://evil.example|click&gt;*')
    expect(facts).toContain('*Error* a &lt; b')
    expect(attachmentOf(message).color).toBe('#E01E5A')
  })

  it('reports a pushed fix as good news, with its pull request and branch', () => {
    const message = buildSlackTemplate(AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED, {
      issue,
      git: {
        branchName: 'fix/orders',
        branchUrl: 'https://github.com/acme/shop/tree/fix/orders',
        prUrl: 'https://github.com/acme/shop/pull/7',
        codeChanges: { additions: 12, deletions: 3 },
      },
    })

    expect(message.plainText).toBe('Agent pushed a fix')
    expect(attachmentOf(message).color).toBe('#36a64f')
    expect(textsOf(message)[1]).toContain('*Branch* <https://github.com/acme/shop/tree/fix/orders|fix/orders>')
    expect(textsOf(message)[1]).toContain('*Changes* +12 / -3 lines')
    expect(buttonsOf(message)[0]).toEqual({ text: 'View Pull Request', url: 'https://github.com/acme/shop/pull/7' })
  })

  it('describes a recorded session', () => {
    const message = buildSlackTemplate(AlertRuleConditionType.SESSION_RECORDING_CREATED, {
      sessionRecording: {
        creationReason: DebugSessionCreationReasonType.MANUAL,
        startedAt: '2026-01-05T10:00:00.000Z',
        durationInSeconds: 95,
        userAttributes: { name: 'Jane', userEmail: 'jane@example.com' },
        resourceAttributes: { osInfo: 'macOS 15', browserInfo: 'Chrome 140' },
        url: 'https://app.example.com/session/1',
      },
    })

    expect(message.plainText).toBe('New manual recording')
    expect(textsOf(message)).toEqual([
      '*Jane\'s session on Jan 5*',
      [
        '*Duration* 1m 35s',
        '*Started* 2026-01-05 at 10:00:00 UTC',
        '*Device* macOS 15 · Chrome 140',
        '*User* Jane · jane@example.com',
      ].join('\n'),
    ])
    expect(buttonsOf(message)).toEqual([{ text: 'Open Recording', url: 'https://app.example.com/session/1' }])
  })
})
