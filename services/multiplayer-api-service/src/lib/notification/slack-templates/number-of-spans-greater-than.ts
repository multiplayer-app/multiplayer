import {
  IIssue,
  IDebugSession,
  OtelSpanCh,
  IProject,
  IWorkspace,
  IAlertRule,
} from '@multiplayer/types'
import { buildIssueUrl } from './issue-url'
import type {
  SectionBlock,
  ActionsBlock,
  MessageAttachment,
  Button,
} from '@slack/web-api'

const SPAN_KIND_MAP: Record<number, string> = {
  0: 'Internal',
  1: 'Server',
  2: 'Client',
  3: 'Producer',
  4: 'Consumer',
}

export default (
  params: {
    spanCount?: number,
    interval?: string,
    issue: IIssue,
    span: OtelSpanCh,
    sessionRecording?: IDebugSession,
    project?: IProject,
    workspace?: IWorkspace,
    slackChannelOptions?: IAlertRule['actions'][number]['slack'],
  },
): { blocks: SectionBlock[], attachments: MessageAttachment[], plainText: string } => {
  const { issue, span, spanCount, interval } = params

  if (!issue || !span) {
    throw new Error('Invalid issue or span')
  }

  const { title, metadata, service } = issue

  const serviceName = service?.serviceName || 'unknown-service'
  const environment = service?.environment || service?.environmentSlug || 'unknown-env'
  const release = service?.release

  const routeFromSpan = (span?.SpanAttributes as any)?.['http.route']
    || (span?.SpanAttributes as any)?.['express.name']
    || (span?.SpanAttributes as any)?.['http.target']
  const methodFromSpan = (span?.SpanAttributes as any)?.['http.method']
  const resolvedRoute = metadata?.httpRoute || routeFromSpan
  const resolvedMethod = metadata?.httpMethod || methodFromSpan
  const resolvedSpanKind = SPAN_KIND_MAP[span?.SpanKind ?? metadata?.spanKind] || 'Unknown'

  const exceptionEvent = Array.isArray(span?.Events)
    ? span.Events.find((e) => e?.Name === 'exception')
    : undefined
  const exceptionAttrs = (exceptionEvent?.Attributes || {}) as any
  const exceptionType = exceptionAttrs?.['exception.type']
  const exceptionMessage = exceptionAttrs?.['exception.message']

  const issueTitle = title || 'Untitled issue'

  const serviceParts = [serviceName, environment]
  if (release) serviceParts.push(`Release ${release}`)
  const serviceDisplay = serviceParts.join(' \u00b7 ')

  const issueUrl = buildIssueUrl(issue)

  const plainText = 'Issue rate threshold exceeded'

  const detailLines: string[] = []
  detailLines.push(`*Environment* ${serviceDisplay}`)

  if (typeof spanCount === 'number') {
    detailLines.push(`*Threshold* ${spanCount} spans within ${interval || 'interval'}`)
  }

  if (resolvedRoute) {
    const routeDisplay = resolvedMethod ? `${resolvedMethod} ${resolvedRoute}` : resolvedRoute
    detailLines.push(`*Endpoint* ${routeDisplay}`)
  }

  detailLines.push(`*Span kind* ${resolvedSpanKind}`)

  if (exceptionType || exceptionMessage) {
    const exceptionDisplay = [exceptionType, exceptionMessage].filter(Boolean).join(': ')
    detailLines.push(`*Error* ${exceptionDisplay}`)
  }

  const attachmentBlocks: (SectionBlock | ActionsBlock)[] = []

  attachmentBlocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `*${issueTitle}*\n_Span count for this issue exceeded the configured threshold._` },
  })

  attachmentBlocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: detailLines.join('\n') },
  })

  if (issueUrl) {
    const openBtn: Button = {
      type: 'button',
      text: { type: 'plain_text', text: 'Open Issue', emoji: true },
      url: issueUrl,
    }
    attachmentBlocks.push({ type: 'actions', elements: [openBtn] })
  }

  const blocks: SectionBlock[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: plainText },
    },
  ]

  const attachments: MessageAttachment[] = [
    {
      color: '#E01E5A',
      fallback: issueTitle,
      blocks: attachmentBlocks,
    },
  ]

  return { blocks, attachments, plainText }
}
