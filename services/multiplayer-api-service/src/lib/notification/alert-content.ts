import {
  AlertRuleConditionType,
  IIssue,
  IDebugSession,
  OtelSpanCh,
} from '@multiplayer/types'
import { OtelSemconv } from '@multiplayer/util'
import { buildIssueUrl } from './slack-templates/issue-url'

// Channel-agnostic description of an alert. Email, Teams and webhook deliveries (and the newer
// Slack templates) all render from this, so every channel reports the same facts.
export interface AlertContent {
  event: string
  headline: string
  title: string
  summary?: string
  facts: { name: string, value: string }[]
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
}

const SPAN_KIND_MAP: Record<number, string> = {
  0: 'Internal',
  1: 'Server',
  2: 'Client',
  3: 'Producer',
  4: 'Consumer',
}

const ISSUE_HEADLINES: Partial<Record<AlertRuleConditionType, (data: AlertData) => [string, string?]>> = {
  [AlertRuleConditionType.NEW_ISSUE_CREATED]: () => ['New issue detected'],
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
    const { sessionRecording } = data
    if (!sessionRecording) {
      throw new Error('Invalid session recording')
    }

    const userAttributes: any = sessionRecording.userAttributes || sessionRecording.sessionAttributes || {}
    const endUser = userAttributes.name || userAttributes.userName || userAttributes.accountName || 'A user'
    const facts: AlertContent['facts'] = []
    if (userAttributes.userEmail) facts.push({ name: 'User', value: userAttributes.userEmail })
    if (typeof sessionRecording.durationInSeconds === 'number') {
      facts.push({ name: 'Duration', value: `${Math.round(sessionRecording.durationInSeconds)}s` })
    }
    const url = (sessionRecording as any).url as string | undefined

    return {
      event,
      headline: 'Session recording created',
      title: `${endUser}'s session`,
      facts,
      url,
      links: url ? [{ title: 'Open Session', url }] : [],
    }
  }

  const { issue } = data
  if (!issue) {
    throw new Error('Invalid issue')
  }

  const issueUrl = buildIssueUrl(issue)
  const links = issueUrl ? [{ title: 'Open Issue', url: issueUrl }] : []
  const facts = describeIssue(issue, data.span)

  if (event === AlertRuleConditionType.DEBUGGING_AGENT_FIX_PUSHED) {
    const { git } = data
    if (git?.branchName) facts.push({ name: 'Branch', value: git.branchName })
    if (git?.codeChanges) {
      facts.push({ name: 'Changes', value: `+${git.codeChanges.additions || 0} / -${git.codeChanges.deletions || 0} lines` })
    }

    return {
      event,
      headline: 'Agent pushed a fix',
      title: issue.title || 'Untitled issue',
      facts,
      url: git?.prUrl || issueUrl,
      links: [...git?.prUrl ? [{ title: 'Open Pull Request', url: git.prUrl }] : [], ...links],
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
    headline,
    title: issue.title || 'Untitled issue',
    summary,
    facts,
    url: issueUrl,
    links,
  }
}
