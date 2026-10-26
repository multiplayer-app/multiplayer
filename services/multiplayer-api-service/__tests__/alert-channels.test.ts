import crypto from 'crypto'
import http from 'http'
import type { AddressInfo } from 'net'
import { AlertRuleConditionType, NotificationType } from '@multiplayer/types'
import { isPrivateAddress, sendSafeRequest, UnsafeUrlError } from '../src/lib/notification/safe-request'
import { isTeamsWebhookHost } from '../src/lib/notification/teams.lib'
import { isSlackWebhookHost } from '../src/lib/notification/slack-webhook.lib'
import { describeAlert } from '../src/lib/notification/alert-content'
import { sendNotification } from '../src/lib/notification/send-notification'
import { sendEmail } from '../src/lib/notification/postmark.lib'
import { NotificationSchema } from '../src/middleware/validation/schema'

// Deliveries go to a local server, which only the dev/test escape hatch permits.
// The SSRF guard itself is tested with the escape hatch explicitly off.
jest.mock('../src/config', () => ({
  ...jest.requireActual('../src/config'),
  NOTIFICATION_ALLOW_PRIVATE_NETWORK: true,
}))
jest.mock('../src/lib/notification/postmark.lib', () => ({ sendEmail: jest.fn() }))

const issue = {
  _id: '6491c2e98a1a2213633434aa',
  workspace: '6491c2e98a1a2213633434bc',
  project: '65109c67d4abb818be2e497d',
  title: 'Order service unavailable',
  hash: 'issue-hash',
  componentHash: 'component-hash',
  metadata: { message: 'order service unavailable', stacktrace: 'Error: secret internals\n    at handler (/app/src/orders.ts:42:7)' },
  service: { serviceName: 'checkout', environment: 'production', release: '1.0.0' },
} as any

const span = {
  TraceId: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
  SpanId: '0000000000000001',
  SpanName: 'POST /orders',
  SpanKind: 1,
  SpanAttributes: { 'http.request.method': 'POST', 'http.route': '/orders' },
  Events: [],
} as any

const alertData = {
  issue,
  span,
  project: { _id: issue.project, name: 'Shop' },
  workspace: { _id: issue.workspace, name: 'Acme' },
  alertRuleName: 'Checkout errors',
}

interface Received { headers: http.IncomingHttpHeaders, body: string }

// Records every request; `respond` decides the answer per attempt (1-based)
const startReceiver = async (respond: (attempt: number, res: http.ServerResponse) => void) => {
  const received: Received[] = []
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      received.push({ headers: req.headers, body })
      respond(received.length, res)
    })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`,
    received,
    close: () => new Promise(resolve => server.close(resolve)),
  }
}

const ok = (_: number, res: http.ServerResponse) => res.writeHead(200).end('ok')

describe('SSRF guard', () => {
  it.each([
    '127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0',
    '::', '::1', '::7f00:1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:a9fe:a9fe', 'fd00::1', 'fe80::1', '2002:7f00:1::1', '64:ff9b::a00:1', 'not-an-ip',
  ])('treats %s as private', (address) => {
    expect(isPrivateAddress(address)).toBe(true)
  })

  it.each(['8.8.8.8', '1.1.1.1', '::ffff:8.8.8.8', '2606:4700:4700::1111'])('treats %s as public', (address) => {
    expect(isPrivateAddress(address)).toBe(false)
  })

  it.each([
    ['plain http', 'http://example.com/hook'],
    ['cloud metadata', 'https://169.254.169.254/latest/meta-data'],
    ['an IPv4-mapped loopback literal', 'https://[::ffff:127.0.0.1]/hook'],
    ['a name resolving to loopback', 'https://localhost/hook'],
    ['a non-http scheme', 'file:///etc/passwd'],
    ['garbage', 'not a url'],
  ])('refuses %s', async (_, url) => {
    await expect(sendSafeRequest(url, { allowPrivateNetwork: false })).rejects.toBeInstanceOf(UnsafeUrlError)
  })
})

describe('Webhook notifications', () => {
  const send = (url: string, secret?: string) => sendNotification({
    notificationType: NotificationType.WEBHOOK,
    webhookOptions: { url, secret },
    template: AlertRuleConditionType.NEW_ISSUE_CREATED,
    email: '',
    data: alertData,
  })

  it('delivers a signed payload without the stack trace', async () => {
    const receiver = await startReceiver(ok)
    const secret = 'whsec_0123456789abcdef'

    try {
      await send(receiver.url, secret)
    } finally {
      await receiver.close()
    }

    expect(receiver.received).toHaveLength(1)
    const [{ headers, body }] = receiver.received
    const expected = crypto.createHmac('sha256', secret).update(`${headers['x-multiplayer-timestamp']}.${body}`).digest('hex')
    expect(headers['x-multiplayer-signature']).toBe(`sha256=${expected}`)
    expect(headers['x-multiplayer-event']).toBe(AlertRuleConditionType.NEW_ISSUE_CREATED)

    const payload = JSON.parse(body)
    expect(payload.id).toBe(headers['x-multiplayer-delivery'])
    expect(payload).toMatchObject({
      event: AlertRuleConditionType.NEW_ISSUE_CREATED,
      headline: 'New issue detected',
      title: issue.title,
      project: { name: 'Shop' },
      issue: { id: issue._id, componentHash: issue.componentHash },
      span: { traceId: span.TraceId },
    })
    expect(body).not.toContain('secret internals')
  })

  it('sends no signature without a secret', async () => {
    const receiver = await startReceiver(ok)

    try {
      await send(receiver.url)
    } finally {
      await receiver.close()
    }

    expect(receiver.received[0].headers['x-multiplayer-signature']).toBeUndefined()
  })

  it('retries a 5xx answer as the same delivery', async () => {
    const receiver = await startReceiver((attempt, res) => res.writeHead(attempt === 1 ? 503 : 200).end())

    try {
      await send(receiver.url, 'whsec_0123456789abcdef')
    } finally {
      await receiver.close()
    }

    expect(receiver.received).toHaveLength(2)
    expect(receiver.received[1].headers['x-multiplayer-delivery']).toBe(receiver.received[0].headers['x-multiplayer-delivery'])
  })

  it.each([
    ['a 4xx answer', 400],
    ['a redirect', 302],
  ])('fails on %s without retrying or following it', async (_, statusCode) => {
    const receiver = await startReceiver((__, res) => res.writeHead(statusCode, { Location: 'http://169.254.169.254/' }).end())

    try {
      await expect(send(receiver.url)).rejects.toThrow(`HTTP ${statusCode}`)
    } finally {
      await receiver.close()
    }

    expect(receiver.received).toHaveLength(1)
  })
})

describe('Microsoft Teams notifications', () => {
  it.each([
    ['prod-12.westus.logic.azure.com', true],
    ['default0123.environment.api.powerplatform.com', true],
    ['acme.webhook.office.com', true],
    ['logic.azure.com.attacker.example', false],
    ['attacker-logic.azure.com.example', false],
    ['example.com', false],
  ])('accepts %s as a Teams webhook host: %s', (hostname, accepted) => {
    expect(isTeamsWebhookHost(hostname)).toBe(accepted)
  })

  it('posts an Adaptive Card', async () => {
    const receiver = await startReceiver(ok)

    try {
      await sendNotification({
        notificationType: NotificationType.TEAMS,
        teamsOptions: { webhookUrl: receiver.url },
        template: AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED,
        email: '',
        data: alertData,
      })
    } finally {
      await receiver.close()
    }

    const card = JSON.parse(receiver.received[0].body).attachments[0]
    expect(card.contentType).toBe('application/vnd.microsoft.card.adaptive')
    expect(card.content.type).toBe('AdaptiveCard')
    expect(JSON.stringify(card.content.body)).toContain('Resolved issue occurred again')
    expect(card.content.body.find(({ type }) => type === 'FactSet').facts).toContainEqual({ title: 'Endpoint', value: 'POST /orders' })
  })
})

describe('Slack incoming webhook notifications', () => {
  it.each([
    ['hooks.slack.com', true],
    ['hooks.slack-gov.com', true],
    ['HOOKS.SLACK.COM', true],
    ['hooks.slack.com.attacker.example', false],
    ['slack.com', false],
  ])('accepts %s as a Slack webhook host: %s', (hostname, accepted) => {
    expect(isSlackWebhookHost(hostname)).toBe(accepted)
  })

  it('posts the same message the Slack app sends', async () => {
    const receiver = await startReceiver(ok)

    try {
      await sendNotification({
        notificationType: NotificationType.SLACK_WEBHOOK,
        slackWebhookOptions: { webhookUrl: receiver.url },
        template: AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED,
        email: '',
        data: alertData,
      })
    } finally {
      await receiver.close()
    }

    const message = JSON.parse(receiver.received[0].body)
    expect(message.text).toBe('Resolved issue occurred again')
    expect(message.blocks?.length).toBeGreaterThan(0)
    expect(JSON.stringify(message.attachments)).toContain('POST /orders')
  })
})

describe('Alert emails', () => {
  beforeEach(() => (sendEmail as jest.Mock).mockReset())

  it('renders issue content escaped in the body and as plain text in the subject', async () => {
    const title = 'Cannot read <img src=x onerror=alert(1)>\n of undefined'

    await sendNotification({
      notificationType: NotificationType.EMAIL,
      template: AlertRuleConditionType.NEW_ISSUE_CREATED,
      email: 'dev@example.com',
      data: { ...alertData, issue: { ...issue, title } },
    })

    const [email, subject, html] = (sendEmail as jest.Mock).mock.calls[0]
    expect(email).toBe('dev@example.com')
    expect(subject).toBe('[Shop] New issue detected: Cannot read <img src=x onerror=alert(1)> of undefined')
    expect(html).toContain('Cannot read &lt;img src&#x3D;x onerror&#x3D;alert(1)&gt;')
    expect(html).not.toContain('<img src=x')
    expect(html).toContain('POST /orders')
    expect(html).toContain('Checkout errors')
  })

  it('keeps non-alert emails on their own templates', async () => {
    await sendNotification({ template: 'CONFIRM_EMAIL', email: 'dev@example.com', data: { token: 'token' } })

    expect((sendEmail as jest.Mock).mock.calls[0][2]).toContain('auth/confirm-email?token&#x3D;token')
  })
})

describe('Alert content', () => {
  it.each(Object.values(AlertRuleConditionType))('describes %s', (type) => {
    const content = describeAlert(type, {
      ...alertData,
      sessionRecording: { _id: 'session', userAttributes: { name: 'Jane' } } as any,
      git: { branchName: 'fix/orders', prUrl: 'https://github.com/acme/shop/pull/1' },
      spanCount: 10,
      affectedEndUsersCount: 3,
      interval: '1h',
    })

    expect(content.headline).toBeTruthy()
    expect(content.title).toBeTruthy()
  })

  it('rejects unknown events', () => {
    expect(() => describeAlert('NOT_A_CONDITION', alertData)).toThrow('ERR_TEMPLATE_NOT_FOUND')
  })
})

describe('Notification request validation', () => {
  const validate = (body: object) => NotificationSchema.createNotificationSchema.validate({
    body: { template: AlertRuleConditionType.NEW_ISSUE_CREATED, email: '', ...body },
  }).error

  it('requires the options of the chosen channel and forbids the others', () => {
    expect(validate({ notificationType: NotificationType.WEBHOOK, webhookOptions: { url: 'https://example.com/hook' } })).toBeUndefined()
    expect(validate({ notificationType: NotificationType.TEAMS, teamsOptions: { webhookUrl: 'https://acme.webhook.office.com/x' } })).toBeUndefined()
    expect(validate({ notificationType: NotificationType.WEBHOOK })).toBeDefined()
    expect(validate({ notificationType: NotificationType.SLACK, webhookOptions: { url: 'https://example.com/hook' } })).toBeDefined()
    expect(validate({ notificationType: NotificationType.TEAMS, teamsOptions: { webhookUrl: 'ftp://example.com' } })).toBeDefined()
    expect(validate({ notificationType: NotificationType.SLACK_WEBHOOK, slackWebhookOptions: { webhookUrl: 'https://hooks.slack.com/services/x' } })).toBeUndefined()
    expect(validate({ notificationType: NotificationType.SLACK_WEBHOOK })).toBeDefined()
  })
})
