import { z } from 'zod'
import {
  IDebugSessionNode,
  AuthType,
  ListDebugSessionsFilter,
  ListGroupedIssuesFilter,
} from './interfaces'
import { buildTraceTree, minimizeNodeData, newDebugSessionNode } from './utils'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { MultiplayerService } from './multiplayerService'
import { MCP_NAME, MCP_VERSION, MAX_SESSION_NODES } from './config'
import { eventWithTime } from '@rrweb/types'
import { DebugSessionNodeType, IIssue, IssueGroupBy } from '@multiplayer/types'

export class MultiplayerMcpServer {
  private service: MultiplayerService
  private readonly server: McpServer

  private escapeMarkdown(value: unknown): string {
    return String(value ?? '')
      .replace(/[|`]/g, '\\$&')
      .replace(/\n/g, ' ')
      .trim()
  }

  private toIsoDate(value: unknown): string {
    const dateValue =
      typeof value === 'string' || typeof value === 'number'
        ? value
        : String(value)
    const date = new Date(dateValue)
    return Number.isNaN(date.getTime()) ? 'n/a' : date.toISOString()
  }

  private formatValue(value: unknown): string {
    if (value === undefined || value === null) return 'n/a'
    if (typeof value === 'object')
      return this.escapeMarkdown(JSON.stringify(value))
    return this.escapeMarkdown(value)
  }

  private formatObjectValue(value: unknown, maxLen = 300): string {
    if (value === undefined || value === null) return 'n/a'
    const raw =
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    const escaped = this.escapeMarkdown(raw)
    return escaped.length > maxLen ? `${escaped.slice(0, maxLen)}...` : escaped
  }

  private toRelativeStepTime(
    baseTimestamp: number,
    currentTimestamp: number,
  ): string {
    const deltaMs = Math.max(0, currentTimestamp - baseTimestamp)
    return `${(deltaMs / 1000).toFixed(1)}s`
  }

  private toRelativeSeconds(
    baseTimestamp: number,
    currentTimestamp: number,
  ): string {
    const deltaMs = Math.max(0, currentTimestamp - baseTimestamp)
    return (deltaMs / 1000).toFixed(1)
  }

  private pickAttributeValue(
    attributes: Record<string, unknown>,
    keys: string[],
  ): string | undefined {
    if (!attributes) return undefined
    for (const key of keys) {
      const value = attributes[key]
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        return String(value).trim()
      }
    }
    return undefined
  }

  private normalizeRequestTarget(rawUrl: string): string {
    const safeUrl = rawUrl.trim()
    if (!safeUrl) return 'n/a'

    try {
      const parsed = new URL(safeUrl)
      return `${parsed.pathname}${parsed.search || ''}`
    } catch {
      return safeUrl
    }
  }

  private extractLatencyMs(
    node: any,
    attrs: Record<string, unknown>,
  ): number | undefined {
    const candidates: Array<unknown> = [
      node.duration,
      attrs['duration_ms'],
      attrs['latency_ms'],
      attrs['http.server.duration'],
      attrs['http.client.duration'],
    ]

    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null || candidate === '')
        continue
      const parsed = Number.parseFloat(String(candidate))
      if (Number.isFinite(parsed) && parsed >= 0) return parsed
    }

    return undefined
  }

  private formatTimelineLine(node: any, baseTimestamp: number): string {
    const attrs = node.SpanAttributes || {}
    const time = this.toRelativeSeconds(
      baseTimestamp,
      Number(node.timestamp) || baseTimestamp,
    )
    const element =
      this.pickAttributeValue(attrs, [
        'element',
        'target_element',
        'event.target.element',
      ]) || 'n/a'
    const text = this.pickAttributeValue(attrs, ['target.innerText'])
    const placeholder = this.pickAttributeValue(attrs, [
      'placeholder',
      'target_placeholder',
      'event.target.placeholder',
    ])
    const url = this.pickAttributeValue(attrs, [
      'url',
      'http.url',
      'location.href',
      'document.url',
    ])
    const targetXpath = this.pickAttributeValue(attrs, ['target_xpath'])

    return [
      '[USER_ACTION]',
      `time: ${time}`,
      `action: "${this.formatValue(node.SpanName)}"`,
      `element: ${this.escapeMarkdown(element)}`,
      ...(targetXpath ? [`targetXpath: ${targetXpath}`] : []),
      ...(text ? [`text: ${this.escapeMarkdown(text)}`] : []),
      ...(placeholder
        ? [`placeholder: ${this.escapeMarkdown(placeholder)}`]
        : []),
      ...(url
        ? [`url: ${this.escapeMarkdown(this.normalizeRequestTarget(url))}`]
        : []),
    ].join('\n')
  }

  private formatKeyValueLines(
    title: string,
    values: Record<string, unknown> | undefined,
    maxEntries = 50,
  ): string[] {
    const entries = Object.entries(values || {})
    if (entries.length === 0) return [`- ${title}: n/a`]
    const lines = [
      `- ${title}:`,
      ...entries
        .slice(0, maxEntries)
        .map(
          ([key, value]) =>
            `  - \`${this.escapeMarkdown(key)}\`: ${this.formatObjectValue(value)}`,
        ),
    ]
    if (entries.length > maxEntries) {
      lines.push(`  - _... ${entries.length - maxEntries} more keys omitted_`)
    }
    return lines
  }

  private formatListSessionsMarkdown(payload: {
    cursor: { total: number; skip?: number; limit?: number };
    data: Array<{
      _id: string;
      name: string;
      startedAt: string | Date;
      stoppedAt: string | Date;
      durationInSeconds?: number;
      url: string;
    }>;
  }): string {
    const lines: string[] = [
      '## Sessions',
      `- Total: ${this.escapeMarkdown(payload.cursor.total)}`,
      `- Skip: ${this.escapeMarkdown(payload.cursor.skip ?? 0)}`,
      `- Limit: ${this.escapeMarkdown(payload.cursor.limit ?? payload.data.length)}`,
      '',
      '| # | Name | Duration (s) | Started At | Stopped At | URL |',
      '|---|------|--------------|------------|------------|-----|',
    ]

    const sessionLines = payload.data.slice(0, 50).map((session, idx) => {
      return `| ${idx + 1} | ${this.escapeMarkdown(session.name)} | ${this.formatValue(session.durationInSeconds)} | ${this.toIsoDate(session.startedAt)} | ${this.toIsoDate(session.stoppedAt)} | ${this.escapeMarkdown(session.url)} |`
    })

    if (sessionLines.length === 0) {
      sessionLines.push('| - | - | - | - | - | - |')
    }

    lines.push(...sessionLines)

    if (payload.data.length > 50) {
      lines.push('', `_Showing first 50 of ${payload.data.length} sessions._`)
    }

    return lines.join('\n')
  }

  private formatGroupedIssuesMarkdown(payload: {
    cursor: { total: number; skip?: number; limit?: number };
    data: Array<
      Partial<IIssue> & { url?: string }
    >;
  }): string {
    const lines: string[] = [
      '## Issues',
      `- Total: ${this.escapeMarkdown(payload.cursor.total)}`,
      `- Skip: ${this.escapeMarkdown(payload.cursor.skip ?? 0)}`,
      `- Limit: ${this.escapeMarkdown(payload.cursor.limit ?? payload.data.length)}`,
      '',
      '| # | Title | Service | Resolved | Last Seen | titleHash | componentHash |',
      '|---|-------|---------|----------|-----------|-----------|---------------|',
    ]

    const issueLines = payload.data.slice(0, 50).map((issue, idx) => {
      return `| ${idx + 1} | ${this.escapeMarkdown(issue.title)} | ${this.escapeMarkdown(issue.service?.serviceName)} | ${this.formatValue(issue.resolved)} | ${this.toIsoDate(issue.lastSeen)} | ${this.escapeMarkdown(issue.titleHash)} | ${this.escapeMarkdown(issue.componentHash)} |`
    })

    if (issueLines.length === 0) {
      issueLines.push('| - | - | - | - | - | - | - |')
    }

    lines.push(...issueLines)

    if (payload.data.length > 50) {
      lines.push('', `_Showing first 50 of ${payload.data.length} issues._`)
    }

    return lines.join('\n')
  }

  private formatIssueDetailsMarkdown(
    issue: Partial<IIssue> & { url?: string },
  ): string {
    const meta = issue.metadata || ({} as NonNullable<IIssue['metadata']>)
    const service = issue.service
    const lines: string[] = [
      '# Issue',
      '',
      '## Overview',
      `title: "${this.escapeMarkdown(issue.title)}"`,
      `category: ${this.formatValue(issue.category)}`,
      `severity: ${this.formatValue(issue.severity)}`,
      `resolved: ${this.formatValue(issue.resolved)}`,
      `archived: ${this.formatValue(issue.archived)}`,
      `last_seen: ${this.toIsoDate(issue.lastSeen)}`,
      `titleHash: ${this.escapeMarkdown(issue.titleHash)}`,
      `componentHash: ${this.escapeMarkdown(issue.componentHash)}`,
      ...(issue.url ? [`url: ${this.escapeMarkdown(issue.url)}`] : []),
      '',
      '## Service',
      `name: ${this.formatValue(service?.serviceName)}`,
      `releases: ${this.formatValue(service?.releases)}`,
      `environments: ${this.formatValue(service?.environments)}`,
      '',
      '## Error',
      `type: ${this.formatValue(meta.type)}`,
      `message: ${this.formatValue(meta.message)}`,
      `culprit: ${this.formatValue(meta.culprit)}`,
      `http: ${this.formatValue(meta.httpMethod)} ${this.formatValue(meta.httpRoute)}`,
    ]

    if (meta.stacktrace) {
      lines.push('', '## Stacktrace', '```', String(meta.stacktrace), '```')
    }

    return lines.join('\n')
  }

  private getNodesMarkdown(
    sortedNodes: any[],
    baseTimestamp: number,
  ): string[] {
    return sortedNodes
      .map((node) => {
        const lines: string[] = []

        if (node.type === DebugSessionNodeType.Event) {
          lines.push(this.formatTimelineLine(node, baseTimestamp))
        }
        if (node.type === DebugSessionNodeType.Trace) {
          const time = this.toRelativeSeconds(
            baseTimestamp,
            Number(node.timestamp) || baseTimestamp,
          )
          if (node.SpanKind === '1') {
            lines.push(
              ...[
                '[CLIENT_TRACE]',
                `time: ${time}`,
                `spanName: ${node.SpanName}`,
                `service: ${node.ServiceName}`,
              ],
            )
          } else {
            const attrs = node.SpanAttributes || {}
            const method =
              this.pickAttributeValue(attrs, [
                'http.request.method',
                'http.method',
              ]) || 'n/a'
            const rawUrl =
              this.pickAttributeValue(attrs, ['url.full', 'http.url']) || 'n/a'
            const status =
              this.pickAttributeValue(attrs, [
                'http.response.status_code',
                'http.status_code',
              ]) || 'n/a'
            // const userAgent = this.pickAttributeValue(attrs, ['http.user_agent', 'user_agent.original'])
            const target = this.normalizeRequestTarget(rawUrl)
            lines.push(
              ...[
                '[API_CALL]',
                `time: ${time}`,
                `method: ${this.escapeMarkdown(method)}`,
                `url: ${this.escapeMarkdown(target)}`,
                `status: ${this.escapeMarkdown(status)}`,
                `service: ${node.ServiceName}`,
              ],
            )
          }
        }
        if (this.isError(node)) {
          const time = this.toRelativeSeconds(
            baseTimestamp,
            Number(node.timestamp) || baseTimestamp,
          )
          lines.push(
            ...[
              `[ERROR] ${time}`,
              ...this.formatKeyValueLines(
                'metadata',
                node.SpanAttributes || node.LogAttributes,
              ),
            ],
          )
        }
        if (node.childSpans?.length) {
          lines.push(...this.getNodesMarkdown(node.childSpans, baseTimestamp))
        }
        return lines.join('\n')
      })
      .filter((line) => line)
  }

  private formatSessionDetailsMarkdown(payload: {
    debugSession: {
      url: string;
      name: string;
      resourceAttributes?: Record<string, unknown>;
      sessionAttributes?: Record<string, unknown>;
      durationInSeconds?: number;
      stoppedAt: string | Date;
    };
    info: Array<any>;
  }): string {
    const sortedNodes = [...payload.info].sort(
      (a, b) => a.timestamp - b.timestamp,
    )
    const baseTimestamp =
      sortedNodes.length > 0
        ? Number(sortedNodes[0].timestamp) || 0
        : Date.now()

    const sessionAttributes = Object.entries(
      payload.debugSession.sessionAttributes || {},
    ).map(
      ([key, value]) =>
        `- \`${this.escapeMarkdown(key)}\`: ${this.formatValue(value)}`,
    )

    const lines = this.getNodesMarkdown(sortedNodes, baseTimestamp)

    return [
      '# Debug Session',
      '',
      '## Session Overview',
      `name: "${this.escapeMarkdown(payload.debugSession.name)}"`,
      `url: ${this.escapeMarkdown(payload.debugSession.url)}`,
      `duration_seconds: ${this.formatValue(payload.debugSession.durationInSeconds)}`,
      `ended_at: ${this.toIsoDate(payload.debugSession.stoppedAt)}`,
      ...(sessionAttributes.length > 0
        ? [
          'session_attributes:',
          ...sessionAttributes.map((line) => line.replace('- ', '  ')),
        ]
        : ['session_attributes: n/a']),
      '',
      '## Timeline',
      lines.join('\n\n'),
    ].join('\n')
  }

  isError(node) {
    const meta = node.meta || node
    switch (node.type) {
      case DebugSessionNodeType.Trace:
        return (
          this.isHttpError(
            this.pickAttributeValue(meta.SpanAttributes, [
              'http.status_code',
              'http.response.status_code',
            ]),
          ) || node.duration > 2000000000
        )
      case DebugSessionNodeType.Console:
        return meta.data?.payload?.level === 'error'
      case DebugSessionNodeType.Event:
        return meta.name === 'exception'
      case DebugSessionNodeType.Log:
        return this.isErrorLog(meta)
      default:
        return false
    }
  }
  isHttpError(data: undefined | number | string): boolean {
    if (!data) {
      return false
    }
    const code = typeof data === 'string' ? Number.parseInt(data) : data
    return code >= 400 && code < 600
  }

  isErrorLog(log: any): boolean {
    if (!log) {
      return false
    }
    const severityText = log.SeverityText || ''
    return (
      severityText.toLowerCase() === 'error' ||
      severityText.toLowerCase() === 'warn'
    )
  }

  private toolError(text: string): {
    content: { type: 'text'; text: string }[];
    isError: true;
  } {
    return { content: [{ type: 'text', text }], isError: true }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }

  /** JSON.stringify that never throws on circular structures. */
  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value)
    } catch {
      const seen = new WeakSet<object>()
      return JSON.stringify(value, (_key, val) => {
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[Circular]'
          seen.add(val)
        }
        return val
      })
    }
  }

  async getSessionById({
    id,
    responseFormat,
  }: {
    id: string;
    responseFormat?: 'markdown' | 'json';
  }): Promise<{
    content: { type: 'text'; text: string }[];
    structuredContent?: any;
    isError?: boolean;
  }> {
    const sessionId = (id || '').trim()
    if (!sessionId) {
      return this.toolError('A session id is required.')
    }

    // 1. Load the session itself. A failure here is fatal for the tool, but we
    //    surface it as a clean MCP error instead of throwing/hanging.
    let debugSession
    try {
      debugSession = await this.service.getDebugSessionById(sessionId)
    } catch (error) {
      return this.toolError(
        `Failed to load session "${sessionId}": ${this.errorMessage(error)}`,
      )
    }

    if (!debugSession) {
      return this.toolError(`No session found for id "${sessionId}".`)
    }

    // 2. Load traces / logs / rrweb concurrently. Partial failures degrade
    //    gracefully — we still return whatever loaded plus warnings.
    const { traces, logs, rrwebEvents, errors } =
      await this.service.getDebugSessionData(debugSession)

    // 3. Assemble the timeline defensively so a malformed node can't take down
    //    the whole response.
    let nodes: IDebugSessionNode<any>[]
    try {
      nodes = [
        ...buildTraceTree(
          (traces || []).filter(
            (node) => this.isError(node) || !node.meta.ParentSpanId,
          ),
        ),
        ...(logs || []),
        ...(rrwebEvents || [])
          .filter((event) => event.type > 3)
          .map((event) =>
            newDebugSessionNode<eventWithTime>(
              DebugSessionNodeType.Console,
              event,
            ),
          ),
      ]
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(minimizeNodeData)
    } catch (error) {
      return this.toolError(
        `Failed to assemble session timeline: ${this.errorMessage(error)}`,
      )
    }

    // 4. Bound the response size so we never emit a multi-MB payload.
    const warnings = [...errors]
    if (nodes.length > MAX_SESSION_NODES) {
      warnings.push(
        `Timeline truncated to ${MAX_SESSION_NODES} of ${nodes.length} nodes.`,
      )
      nodes = nodes.slice(0, MAX_SESSION_NODES)
    }

    const payload = {
      debugSession: {
        url: this.service.getSessionUrl(debugSession),
        name: debugSession.name,
        resourceAttributes: debugSession.resourceAttributes,
        sessionAttributes: debugSession.sessionAttributes,
        durationInSeconds: debugSession.durationInSeconds,
        stoppedAt: debugSession.stoppedAt,
      },
      info: nodes,
      ...(warnings.length ? { warnings } : {}),
    }

    if (responseFormat === 'json') {
      return {
        structuredContent: payload,
        content: [{ type: 'text', text: this.safeStringify(payload) }],
      }
    }

    const markdown = this.formatSessionDetailsMarkdown(payload)
    const text = warnings.length
      ? `${markdown}\n\n## Warnings\n${warnings
        .map((warning) => `- ${this.escapeMarkdown(warning)}`)
        .join('\n')}`
      : markdown

    return {
      content: [{ type: 'text', text }],
    }
  }

  async listSessions(
    filter: ListDebugSessionsFilter & { responseFormat?: 'markdown' | 'json' },
  ): Promise<{
    content: { type: 'text'; text: string }[];
    structuredContent?: any;
  }> {
    const responseFormat = filter.responseFormat || 'markdown'
    const debugSessions = await this.service.listDebugSessions(
      Object.fromEntries(
        Object.entries({
          skip: filter.skip,
          limit: filter.limit,
          name: filter.name,
          startedAfterTimestamp: filter.startedAfterTimestamp,
          startedBeforeTimestamp: filter.startedBeforeTimestamp,
          maxDurationInSeconds: filter.maxDurationInSeconds,
          minDurationInSeconds: filter.minDurationInSeconds,
          metadata: filter.metadata,
          hasStarred: filter.hasStarred,
          sortDirection: filter.sortDirection,
          sortKey: filter.sortKey,
        }).filter(([, value]) => value !== undefined),
      ),
    )

    if (!debugSessions) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to retrieve debug sessions',
          },
        ],
      }
    }
    const payload = {
      cursor: debugSessions.cursor,
      data: debugSessions.data.map((debugSession) => ({
        url: this.service.getSessionUrl(debugSession),
        ...debugSession,
      })),
    }

    if (responseFormat === 'json') {
      return {
        structuredContent: payload,
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: this.formatListSessionsMarkdown(payload),
        },
      ],
    }
  }

  async listGroupedIssues(
    filter: ListGroupedIssuesFilter & { responseFormat?: 'markdown' | 'json' },
  ): Promise<{
    content: { type: 'text'; text: string }[];
    structuredContent?: any;
    isError?: boolean;
  }> {
    const responseFormat = filter.responseFormat || 'markdown'

    let issues
    try {
      issues = await this.service.listGroupedIssues(
        Object.fromEntries(
          Object.entries({
            groupBy: filter.groupBy,
            skip: filter.skip,
            limit: filter.limit,
            sortKey: filter.sortKey,
            sortDirection: filter.sortDirection,
            resolved: filter.resolved,
            archived: filter.archived,
            severity: filter.severity,
            category: filter.category,
            title: filter.title,
            text: filter.text,
            titleHash: filter.titleHash,
            componentHash: filter.componentHash,
          }).filter(([, value]) => value !== undefined),
        ),
      )
    } catch (error) {
      return this.toolError(
        `Failed to list issues: ${this.errorMessage(error)}`,
      )
    }

    if (!issues) {
      return this.toolError('Failed to retrieve issues')
    }

    const payload = {
      cursor: issues.cursor,
      data: (issues.data || []).map((issue) => ({
        ...issue,
        url: this.service.getIssueUrl(issue),
      })),
    }

    if (responseFormat === 'json') {
      return {
        structuredContent: payload,
        content: [{ type: 'text', text: this.safeStringify(payload) }],
      }
    }

    return {
      content: [
        { type: 'text', text: this.formatGroupedIssuesMarkdown(payload) },
      ],
    }
  }

  async getIssueByTitleHash({
    titleHash,
    responseFormat,
  }: {
    titleHash: string;
    responseFormat?: 'markdown' | 'json';
  }): Promise<{
    content: { type: 'text'; text: string }[];
    structuredContent?: any;
    isError?: boolean;
  }> {
    const hash = (titleHash || '').trim()
    if (!hash) {
      return this.toolError('A titleHash is required.')
    }

    let issue: IIssue
    try {
      issue = await this.service.getIssueByTitleHash(hash)
    } catch (error) {
      return this.toolError(
        `Failed to load issue "${hash}": ${this.errorMessage(error)}`,
      )
    }

    if (!issue) {
      return this.toolError(`No issue found for titleHash "${hash}".`)
    }

    const payload = { ...issue, url: this.service.getIssueUrl(issue) }

    if (responseFormat === 'json') {
      return {
        structuredContent: payload,
        content: [{ type: 'text', text: this.safeStringify(payload) }],
      }
    }

    return {
      structuredContent: payload,
      content: [{ type: 'text', text: this.formatIssueDetailsMarkdown(payload) }],
    }
  }

  async resolveIssues({
    titleHashes,
    resolved = true,
    archived = false,
  }: {
    titleHashes: string[];
    resolved?: boolean;
    archived?: boolean;
  }): Promise<{
    content: { type: 'text'; text: string }[];
    structuredContent?: any;
    isError?: boolean;
  }> {
    const hashes = (titleHashes || []).map((hash) => (hash || '').trim()).filter(Boolean)
    if (hashes.length === 0) {
      return this.toolError('At least one titleHash is required.')
    }

    let updated: IIssue[]
    try {
      updated = await this.service.resolveIssues({ titleHashes: hashes, resolved, archived })
    } catch (error) {
      return this.toolError(
        `Failed to update issues: ${this.errorMessage(error)}`,
      )
    }

    const count = Array.isArray(updated) ? updated.length : 0
    const action = resolved ? 'resolved' : 'reopened'
    const text = `${action} ${count} issue(s) for titleHash(es): ${hashes.join(', ')}.`

    return {
      structuredContent: { updated: count, titleHashes: hashes, resolved, archived },
      content: [{ type: 'text', text }],
    }
  }

  constructor(params: {
    authKey: string;
    authType: AuthType;
    workspace: string;
    project: string;
  }) {
    this.service = new MultiplayerService(params)
    this.server = new McpServer(
      {
        name: MCP_NAME,
        version: MCP_VERSION,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    )
    this.init()
  }

  private init() {
    this.server.tool(
      'get_project_url',
      'Get url of current authorized project within Multiplayer',
      {},
      {
        title: 'Get url of current authorized project within Multiplayer',
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      () => {
        return {
          content: [
            {
              type: 'text',
              text: this.service.getCurrentProjectUrl(),
            },
          ],
        }
      },
    )

    this.server.tool(
      'list_sessions',
      'List multiplayer sessions',
      {
        skip: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe('Number of items to skip, default is 0'),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Maximum number of items to return, default is 30'),
        name: z
          .string()
          .optional()
          .describe('session name full or partial match'),
        startedAfterTimestamp: z
          .number()
          .nonnegative()
          .optional()
          .describe('session start time is bigger then unix timestamp'),
        startedBeforeTimestamp: z
          .number()
          .nonnegative()
          .optional()
          .describe('session start time is less then unix timestamp'),
        maxDurationInSeconds: z
          .number()
          .nonnegative()
          .optional()
          .describe('session is shorter then N seconds'),
        minDurationInSeconds: z
          .number()
          .nonnegative()
          .optional()
          .describe('session is longer then N seconds'),
        metadata: z
          .record(z.string())
          .optional()
          .describe('user defined fields, all unknown fields go here'),
        hasStarred: z.boolean().optional().describe('has starred spans inside'),
        sortDirection: z
          .union([z.literal(-1), z.literal(1)])
          .optional()
          .describe('sort direction, default -1'),
        sortKey: z
          .string()
          .optional()
          .describe('debug session schema field name, default _id'),
        responseFormat: z
          .enum(['markdown', 'json'])
          .optional()
          .default('markdown')
          .describe(
            'Output format for text content, set only if specified by user',
          ),
      },
      {
        title: 'List multiplayer debug sessions with filter',
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      this.listSessions.bind(this),
    )
    this.server.tool(
      'get_session_notes_by_session_id',
      'Get user notes for multiplayer session',
      { id: z.string().describe('id of session') },
      {
        title: 'Get user notes for multiplayer session',
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },

      async ({ id }: { id: string }) => {
        if (!id) throw new Error('id of debug session is missed')
        const userNotes = await this.service.getNotesContent(id)
        return {
          content: userNotes?.resources || [],
        }
      },
    )
    this.server.tool(
      'get_session_by_id',
      'Get multiplayer session by id',
      {
        id: z.string().describe('id of session'),
        responseFormat: z
          .enum(['markdown', 'json'])
          .optional()
          .default('markdown')
          .describe(
            'Output format for text content, set only if specified by user',
          ),
      },
      {
        title: 'Get multiplayer session by id',
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      this.getSessionById.bind(this),
    )

    this.server.tool(
      'get_issue_debug_context',
      'Fetch traces and logs for an issue by its component hash. Use this to understand the runtime context of an error before analyzing code.',
      { componentHash: z.string().describe('Issue component hash') },
      {
        title: 'Get issue debug context (traces and logs)',
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      async ({ componentHash }: { componentHash: string }) => {
        const context = await this.service.getIssueDebugContext(componentHash)

        if (!context) {
          return {
            content: [
              { type: 'text', text: 'No debug session found for this issue' },
            ],
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                sessionId: context.debugSession._id,
                traces: context.traces,
                logs: context.logs,
              }),
            },
          ],
        }
      },
    )

    this.server.tool(
      'get_issue_by_title_hash',
      'Fetch a single issue\'s full metadata by its title hash — title, severity, category, service, error message, culprit, http route, and stacktrace. Use this to understand what an issue is before fixing it.',
      {
        titleHash: z.string().describe('Issue title hash'),
        responseFormat: z
          .enum(['markdown', 'json'])
          .optional()
          .default('markdown')
          .describe(
            'Output format for text content, set only if specified by user',
          ),
      },
      {
        title: 'Get issue details by title hash',
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      this.getIssueByTitleHash.bind(this),
    )

    this.server.tool(
      'list_grouped_issues',
      'List issues for the current project, grouped by a hash (componentHash by default). Use this to discover open/unresolved issues to triage or fix. Each row includes the titleHash and componentHash needed by get_issue_debug_context and resolve_issues.',
      {
        groupBy: z
          .nativeEnum(IssueGroupBy)
          .optional()
          .default(IssueGroupBy.COMPONENT_HASH)
          .describe('Field to group issues by, default componentHash'),
        skip: z
          .number()
          .int()
          .nonnegative()
          .optional()
          .describe('Number of items to skip, default is 0'),
        limit: z
          .number()
          .int()
          .positive()
          .max(1000)
          .optional()
          .describe('Maximum number of items to return'),
        resolved: z
          .boolean()
          .optional()
          .describe('Filter by resolved state; pass false to list open issues'),
        archived: z
          .boolean()
          .optional()
          .describe('Filter by archived state, default excludes archived'),
        severity: z
          .number()
          .optional()
          .describe('Filter by issue severity level'),
        category: z
          .string()
          .optional()
          .describe('Filter by issue category'),
        title: z
          .string()
          .optional()
          .describe('Filter by issue title full or partial match'),
        text: z
          .string()
          .optional()
          .describe('Free-text search across issues'),
        titleHash: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe('Filter to one or more title hashes'),
        componentHash: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe('Filter to one or more component hashes'),
        sortKey: z
          .string()
          .optional()
          .describe('Issue field name to sort by'),
        sortDirection: z
          .union([z.literal(-1), z.literal(1)])
          .optional()
          .describe('Sort direction, default -1'),
        responseFormat: z
          .enum(['markdown', 'json'])
          .optional()
          .default('markdown')
          .describe(
            'Output format for text content, set only if specified by user',
          ),
      },
      {
        title: 'List grouped issues with filter',
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      this.listGroupedIssues.bind(this),
    )

    this.server.tool(
      'resolve_issues',
      'Mark one or more issues as resolved (or reopen them) by title hash. Use after a fix is verified. Resolves all issues sharing each title hash.',
      {
        titleHashes: z
          .array(z.string())
          .min(1)
          .describe('Title hash(es) of the issue group(s) to update'),
        resolved: z
          .boolean()
          .optional()
          .default(true)
          .describe('Set resolved state; true to resolve, false to reopen'),
        archived: z
          .boolean()
          .optional()
          .default(false)
          .describe('Also set archived state, default false'),
      },
      {
        title: 'Resolve or reopen issues by title hash',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      this.resolveIssues.bind(this),
    )
  }

  getServer() {
    return this.server
  }
}
