import {
  AlertRuleConditionType,
  DebugSessionCreationReasonType,
  IIssue,
  IDebugSession,
  OtelSpanCh,
} from '@multiplayer/types'
import { OtelSemconv } from '@multiplayer/util'
import { buildTraceLinks, getTraceLinkTarget, type TraceLinkConfig } from '@multiplayer/util-shared'
import { buildIssueUrl } from './issue-url'

// Channel-agnostic description of an alert. Every channel (Slack, email, Teams, webhooks) renders
// from this, so they all report the same facts and links.
export interface AlertContent {
  event: string
  // Issues report a failure; a fix pushed by the agent is good news
  tone: 'error' | 'success'
  headline: string
  title: string
  summary?: string
  facts: { name: string, value: string, url?: string }[]
  url?: string
  links: { title: string, url: string }[]
}

export interface AlertData {
  issue?: IIssue
  // Absent for state-change alerts, which a user triggers rather than an occurrence
  span?: OtelSpanCh
  sessionRecording?: IDebugSession
  git?: {
    branchName: string
    branchUrl?: string
    prUrl?: string
    codeChanges?: { additions?: number, deletions?: number }
  }
  spanCount?: number
  affectedEndUsersCount?: number
  interval?: string
  // Only its trace links are read here
  project?: { settings?: { traceLinks?: TraceLinkConfig[] } }
  workspace?: { name?: string }
}

// The occurrence's trace in the project's own tools (project settings, trace links). Without the
// attribute on the span, the issue's environment - the one alert rule scopes match - is used.
export const getAlertTraceLinks = (data: AlertData): AlertContent['links'] => {
  const target = getTraceLinkTarget(data.span)

  return buildTraceLinks(
    data.project?.settings?.traceLinks,
    target && { ...target, environment: target.environment || data.issue?.service?.environment },
  ).map(({ name, url }) => ({ title: name, url }))
}

const SPAN_KIND_MAP: Record<number, string> = {
  0: 'Internal',
  1: 'Server',
  2: 'Client',
  3: 'Producer',
  4: 'Consumer',
}

const SESSION_HEADLINES: Record<string, string> = {
  [DebugSessionCreationReasonType.MANUAL]: 'New manual recording',
  [DebugSessionCreationReasonType.ISSUE]: 'New issue-triggered recording',
  [DebugSessionCreationReasonType.AUTO]: 'New session recording',
}

// The recorded user, as the session's attributes name them
const getSessionUserName = (session?: IDebugSession): string | undefined => {
  const userAttributes: any = session?.userAttributes || {}
  const sessionAttributes: any = session?.sessionAttributes || {}

  return userAttributes.name
    || userAttributes.userName
    || sessionAttributes.userName
    || userAttributes.accountName
    || sessionAttributes.accountName
}

const ISSUE_HEADLINES: Partial<Record<AlertRuleConditionType, (data: AlertData) => [string, string?]>> = {
  [AlertRuleConditionType.NEW_ISSUE_CREATED]: ({ sessionRecording, workspace }) => [
    `New issue created by ${getSessionUserName(sessionRecording) || workspace?.name || 'System'}`,
  ],
  [AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN]: () => [
    'Issue rate threshold exceeded',
    'Span count for this issue exceeded the configured threshold.',
  ],
  [AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN]: () => [
    'Affected users threshold exceeded',
    'The number of users affected by this issue exceeded the configured threshold.',
  ],
  [AlertRuleConditionType.ISSUE_MARKED_AS_UNRESOLVED]: ({ span }) => (span
    ? ['Resolved issue occurred again', 'This issue was resolved but occurred again (regression) and has been reopened.']
    : ['Issue marked as unresolved', 'This issue was reopened.']),
  [AlertRuleConditionType.ISSUE_UNARCHIVED]: () => ['Issue unarchived', 'This issue was unarchived and is tracked again.'],
  [AlertRuleConditionType.NEW_ISSUE_SEVERITY_MARKED_AS_HIGH]: () => ['Issue severity set to HIGH', 'This issue was triaged as high severity.'],
  [AlertRuleConditionType.EXISTING_ISSUE_SEVERITY_MARKED_AS_HIGH]: () => ['Issue severity raised to HIGH', 'The severity of this issue was raised to high.'],
}

const formatDuration = (totalSeconds?: number): string | undefined => {
  if (totalSeconds == null) return undefined
  if (totalSeconds < 60) return `${Number(totalSeconds.toFixed(3))}s`

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.round(totalSeconds % 60)
  const parts: string[] = []
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}m`)
  if (seconds || parts.length === 0) parts.push(`${seconds}s`)
  return parts.join(' ')
}

// Recipients are anywhere: times are given in UTC, labelled
const formatUtcTimestamp = (date: Date) => `${date.toISOString().slice(0, 19).replace('T', ' at ')} UTC`

const describeSession = (event: string, session: IDebugSession, data: AlertData): AlertContent => {
  const userAttributes: any = session.userAttributes || {}
  const sessionAttributes: any = session.sessionAttributes || {}
  const resourceAttributes: any = session.resourceAttributes || {}

  const userName = getSessionUserName(session) || data.workspace?.name || 'Unknown User'
  const userEmail = userAttributes.userEmail || sessionAttributes.userEmail
  const startedAt = session.startedAt ? new Date(session.startedAt) : undefined
  const stoppedAt = session.stoppedAt ? new Date(session.stoppedAt) : undefined
  const duration = formatDuration(session.durationInSeconds
    ?? (startedAt && stoppedAt ? Math.max(0, (stoppedAt.getTime() - startedAt.getTime()) / 1000) : undefined))
  const device = [resourceAttributes.osInfo, resourceAttributes.browserInfo, resourceAttributes.deviceInfo].filter(Boolean)
  const creationReason = session.creationReason || DebugSessionCreationReasonType.AUTO
  const issueCount = Array.isArray(session.issues) ? session.issues.length : 0
  const url = (session as any).url as string | undefined

  const facts: AlertContent['facts'] = []
  if (duration) facts.push({ name: 'Duration', value: duration })
  if (startedAt) facts.push({ name: 'Started', value: formatUtcTimestamp(startedAt) })
  if (device.length) facts.push({ name: 'Device', value: device.join(' · ') })
  facts.push({ name: 'User', value: [userName, userEmail].filter(Boolean).join(' · ') })
  if (creationReason === DebugSessionCreationReasonType.ISSUE && issueCount) {
    facts.push({ name: 'Triggered by', value: `${issueCount} linked issue${issueCount > 1 ? 's' : ''}` })
  }

  const day = startedAt
    ? startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    : 'Unknown Date'

  return {
    event,
    tone: 'error',
    headline: SESSION_HEADLINES[creationReason] || SESSION_HEADLINES[DebugSessionCreationReasonType.AUTO],
    title: `${userName}'s session on ${day}`,
    facts,
    url,
    links: url ? [{ title: 'Open Recording', url }] : [],
  }
}

const describeIssue = (issue: IIssue, span?: OtelSpanCh): AlertContent['facts'] => {
  const { metadata, service } = issue
  const facts: AlertContent['facts'] = []

  const serviceParts = [
    service?.serviceName || 'unknown-service',
    service?.environment || service?.environmentSlug || 'unknown-env',
  ]
  if (service?.release) serviceParts.push(`Release ${service.release}`)
  facts.push({ name: 'Environment', value: serviceParts.join(' · ') })

  const route = metadata?.httpRoute
    || (span?.SpanAttributes as any)?.['http.route']
    || (span?.SpanAttributes as any)?.['express.name']
    || OtelSemconv.getAttributeFromMap(span?.SpanAttributes, 'http.target')
  const method = metadata?.httpMethod || OtelSemconv.getAttributeFromMap(span?.SpanAttributes, 'http.method')
  if (route) facts.push({ name: 'Endpoint', value: method ? `${method} ${route}` : route })

  const spanKind = SPAN_KIND_MAP[span?.SpanKind ?? metadata?.spanKind]
  if (spanKind) facts.push({ name: 'Span kind', value: spanKind })

  const exceptionAttrs = ((Array.isArray(span?.Events)
    ? span.Events.find(e => e?.Name === 'exception')
    : undefined)?.Attributes || {}) as any
  const error = [
    exceptionAttrs['exception.type'] || metadata?.type,
    exceptionAttrs['exception.message'] || metadata?.message,
  ].filter(Boolean).join(': ')
  if (error) facts.push({ name: 'Error', value: error })

  return facts
}

export const describeAlert = (event: string, data: AlertData): AlertContent => {
  if (event === AlertRuleConditionType.SESSION_RECORDING_CREATED) {
    if (!data.sessionRecording) {
      throw new Error('Invalid session recording')
    }

    return describeSession(event, data.sessionRecording, data)
  }

  const { issue } = data
  if (!issue) {
    throw new Error('Invalid issue')
  }

  const issueUrl = buildIssueUrl(issue)
  const links = [...issueUrl ? [{ title: 'Open Issue', url: issueUrl }] : [], ...getAlertTraceLinks(data)]
  const facts = describeIssue(issue, data.span)
  const title = issue.title || 'Untitled issue'

  if (event === AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED) {
    const { git } = data
    if (git?.branchName) facts.push({ name: 'Branch', value: git.branchName, url: git.branchUrl })
    if (git?.codeChanges) {
      facts.push({ name: 'Changes', value: `+${git.codeChanges.additions || 0} / -${git.codeChanges.deletions || 0} lines` })
    }

    return {
      event,
      tone: 'success',
      headline: 'Agent pushed a fix',
      title,
      facts,
      url: git?.prUrl || issueUrl,
      links: [...git?.prUrl ? [{ title: 'View Pull Request', url: git.prUrl }] : [], ...links],
    }
  }

  const describeHeadline = ISSUE_HEADLINES[event as AlertRuleConditionType]
  if (!describeHeadline) {
    throw new Error(`ERR_TEMPLATE_NOT_FOUND "${event}"`)
  }

  const [headline, summary] = describeHeadline(data)
  if (typeof data.spanCount === 'number' && event === AlertRuleConditionType.NUMBER_OF_SPANS_IN_ISSUE_GREATER_THAN) {
    facts.splice(1, 0, { name: 'Threshold', value: `${data.spanCount} spans within ${data.interval || 'interval'}` })
  }
  if (typeof data.affectedEndUsersCount === 'number' && event === AlertRuleConditionType.NUMBER_OF_AFFECTED_END_USERS_IN_ISSUE_GREATER_THAN) {
    facts.splice(1, 0, { name: 'Threshold', value: `${data.affectedEndUsersCount} users within ${data.interval || 'interval'}` })
  }

  return {
    event,
    tone: 'error',
    headline,
    title,
    summary,
    facts,
    url: issueUrl,
    links,
  }
}
