import { AuthType, DebugSessionNodeType } from '../src/interfaces'
import { MultiplayerMcpServer } from '../src/server'

describe('MultiplayerMcpServer markdown formatters', () => {
  const server = new MultiplayerMcpServer({
    authKey: 'test-key',
    authType: AuthType.API_KEY,
    workspace: 'ws',
    project: 'proj',
  }) as any

  it('formats list sessions as markdown table', () => {
    const markdown = server.formatListSessionsMarkdown({
      cursor: { total: 2, skip: 0, limit: 30 },
      data: [
        {
          _id: '1',
          name: 'Checkout flow',
          startedAt: '2026-03-05T10:00:00.000Z',
          stoppedAt: '2026-03-05T10:01:00.000Z',
          durationInSeconds: 60,
          url: 'https://example.com/session/1',
        },
        {
          _id: '2',
          name: 'Login flow',
          startedAt: '2026-03-05T10:02:00.000Z',
          stoppedAt: '2026-03-05T10:03:00.000Z',
          durationInSeconds: 59,
          url: 'https://example.com/session/2',
        },
      ],
    })

    expect(markdown).toContain('## Sessions')
    expect(markdown).toContain('| # | Name | Duration (s) | Started At | Stopped At | URL |')
    expect(markdown).toContain('Checkout flow')
    expect(markdown).toContain('Login flow')
  })

  it('formats session details with node summary and timeline', () => {
    const markdown = server.formatSessionDetailsMarkdown({
      debugSession: {
        url: 'https://example.com/session/abc',
        name: 'Critical incident',
        resourceAttributes: { 'service.name': 'api-service' },
        sessionAttributes: { environment: 'prod', userId: 'u1' },
        durationInSeconds: 120,
        stoppedAt: '2026-03-05T11:00:00.000Z',
      },
      info: [
        {
          type: DebugSessionNodeType.Trace,
          timestamp: 1741162800000,
          SpanName: 'GET /api/orders',
          ServiceName: 'api-service',
          SpanAttributes: { 'http.status_code': '500', route: '/api/orders' },
          childSpans: [
            {
              SpanName: 'db.query',
              timestamp: 1741162800500,
            },
          ],
        },
        {
          type: DebugSessionNodeType.Log,
          timestamp: 1741162801000,
          SpanName: 'order.error',
          ServiceName: 'api-service',
          LogAttributes: { level: 'error', message: 'database timeout' },
        },
      ],
    })

    expect(markdown).toContain('## Debug Session')
    expect(markdown).toContain('## Node Summary')
    expect(markdown).toContain('- trace: 1')
    expect(markdown).toContain('- log: 1')
    expect(markdown).toContain('## Timeline (2 events)')
    expect(markdown).toContain('## Node Details')
    expect(markdown).toContain('### Node 1')
    expect(markdown).toContain('Span Attributes')
    expect(markdown).toContain('Child spans: 1')
    expect(markdown).toContain('### Node 2')
    expect(markdown).toContain('Log Attributes')
  })

  it('renders console node metadata in node details', () => {
    const markdown = server.formatNodeDetailsMarkdown([
      {
        type: DebugSessionNodeType.Console,
        timestamp: 1741162800000,
        SpanName: 'console.error',
        ServiceName: 'web-client',
        meta: { level: 'error', args: ['boom'] },
      },
    ])

    expect(markdown).toContain('Console Meta')
    expect(markdown).toContain('boom')
  })

  it('truncates node details to first 40 nodes with footer', () => {
    const nodes = Array.from({ length: 41 }, (_, idx) => ({
      type: DebugSessionNodeType.Event,
      timestamp: 1741162800000 + idx,
      SpanName: `event-${idx + 1}`,
      ServiceName: 'web-client',
      SpanAttributes: { index: idx + 1 },
    }))

    const markdown = server.formatNodeDetailsMarkdown(nodes)

    expect(markdown).toContain('### Node 40')
    expect(markdown).not.toContain('### Node 41')
    expect(markdown).toContain('Showing first 40 of 41 nodes.')
  })

  it('formats grouped issues as markdown table', () => {
    const markdown = server.formatGroupedIssuesMarkdown({
      cursor: { total: 2, skip: 0, limit: 30 },
      data: [
        {
          title: 'TypeError: cannot read property',
          service: { serviceName: 'api-service' },
          resolved: false,
          lastSeen: '2026-03-05T10:00:00.000Z',
          titleHash: 'title-1',
          componentHash: 'comp-1',
          url: 'https://example.com/issue/1',
        },
        {
          title: 'Database timeout',
          service: { serviceName: 'worker' },
          resolved: true,
          lastSeen: '2026-03-05T11:00:00.000Z',
          titleHash: 'title-2',
          componentHash: 'comp-2',
          url: 'https://example.com/issue/2',
        },
      ],
    })

    expect(markdown).toContain('## Issues')
    expect(markdown).toContain('| # | Title | Service | Resolved | Last Seen | titleHash | componentHash |')
    expect(markdown).toContain('TypeError: cannot read property')
    expect(markdown).toContain('title-1')
    expect(markdown).toContain('comp-2')
  })

  it('formats a single issue details with stacktrace', () => {
    const markdown = server.formatIssueDetailsMarkdown({
      title: 'THIS IS A TEST',
      category: 'EXCEPTION',
      severity: null,
      resolved: false,
      archived: false,
      lastSeen: '2026-06-04T12:52:49.630Z',
      titleHash: '5401804ccc62b928af319bb2fcb48d37',
      componentHash: '6fa7f880823347a8f7b8ec8b0f7f04cc',
      url: 'https://example.com/issue/test',
      service: { serviceName: 'version', releases: ['0.0.1'], environments: ['local'] },
      metadata: {
        spanKind: 2,
        type: 'BadRequest',
        message: 'THIS IS A TEST',
        culprit: 'GET /v0/version/...',
        httpMethod: 'GET',
        httpRoute: '/v0/version/:workspaceId',
        stacktrace: 'BadRequestError: THIS IS A TEST\n    at exports.default (...)',
      },
    })

    expect(markdown).toContain('# Issue')
    expect(markdown).toContain('title: "THIS IS A TEST"')
    expect(markdown).toContain('name: version')
    expect(markdown).toContain('## Stacktrace')
    expect(markdown).toContain('BadRequestError: THIS IS A TEST')
  })
})
