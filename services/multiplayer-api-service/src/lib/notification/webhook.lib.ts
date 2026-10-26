import crypto from 'crypto'
import { IProject, IWorkspace } from '@multiplayer/types'
import { describeAlert, type AlertData } from './alert-content'
import { postWithRetries } from './safe-request'

// Alert webhooks. Receivers verify `X-Multiplayer-Signature` = "sha256=" + HMAC-SHA256(secret,
// `${X-Multiplayer-Timestamp}.${rawBody}`) and should reject stale timestamps to prevent replays.
// `X-Multiplayer-Delivery` stays the same across retries of one delivery, for deduplication.

export const signWebhookPayload = (secret: string, timestamp: string, body: string) => crypto
  .createHmac('sha256', secret)
  .update(`${timestamp}.${body}`)
  .digest('hex')

export const buildWebhookPayload = (
  event: string,
  data: AlertData & { project?: IProject, workspace?: IWorkspace },
  deliveryId: string,
) => {
  const content = describeAlert(event, data)
  const { issue, span, sessionRecording, project, workspace } = data
  const { stacktrace, ...issueMetadata } = (issue?.metadata || {}) as any

  return {
    id: deliveryId,
    event,
    createdAt: new Date().toISOString(),
    headline: content.headline,
    title: content.title,
    summary: content.summary,
    url: content.url,
    facts: content.facts,
    links: content.links,
    workspace: workspace ? { id: String(workspace._id), name: workspace.name } : undefined,
    project: project ? { id: String(project._id), name: project.name } : undefined,
    issue: issue
      ? {
        id: String((issue as any)._id),
        title: issue.title,
        category: issue.category,
        severity: issue.severity,
        hash: issue.hash,
        componentHash: issue.componentHash,
        resolved: issue.resolved,
        archived: issue.archived,
        service: issue.service,
        metadata: issueMetadata,
        firstSeen: issue.createdAt,
        lastSeen: issue.lastSeen,
      }
      : undefined,
    span: span
      ? {
        traceId: span.TraceId,
        spanId: span.SpanId,
        name: span.SpanName,
        serviceName: span.ServiceName,
        statusCode: span.StatusCode,
        statusMessage: span.StatusMessage,
      }
      : undefined,
    sessionRecording: sessionRecording
      ? { id: String(sessionRecording._id), url: (sessionRecording as any).url }
      : undefined,
  }
}

export const sendWebhookNotification = async (
  { url, secret }: { url: string, secret?: string },
  event: string,
  data: any,
) => {
  const deliveryId = crypto.randomUUID()
  const body = JSON.stringify(buildWebhookPayload(event, data, deliveryId))

  await postWithRetries(url, () => {
    const timestamp = Math.floor(Date.now() / 1000).toString()

    return {
      body,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Multiplayer-Webhooks/1.0',
        'X-Multiplayer-Event': event,
        'X-Multiplayer-Delivery': deliveryId,
        'X-Multiplayer-Timestamp': timestamp,
        ...secret ? { 'X-Multiplayer-Signature': `sha256=${signWebhookPayload(secret, timestamp, body)}` } : {},
      },
    }
  })
}
