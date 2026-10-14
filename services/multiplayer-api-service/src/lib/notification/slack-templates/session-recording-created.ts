import {
  IDebugSession,
  IProject,
  IWorkspace,
  IAlertRule,
  DebugSessionCreationReasonType,
} from '@multiplayer/types'
import type {
  SectionBlock,
  ActionsBlock,
  MessageAttachment,
  Button,
} from '@slack/web-api'

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

const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatFullTimestamp = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} at ${hh}:${mm}:${ss}`
}

const HEADER_BY_REASON: Record<string, string> = {
  [DebugSessionCreationReasonType.MANUAL]: 'New manual recording',
  [DebugSessionCreationReasonType.ISSUE]: 'New issue-triggered recording',
  [DebugSessionCreationReasonType.AUTO]: 'New session recording',
}

export default (
  params: {
    sessionRecording: IDebugSession,
    project: IProject,
    workspace: IWorkspace,
    slackChannelOptions?: IAlertRule['actions'][number]['slack'],
  },
): { blocks: SectionBlock[], attachments: MessageAttachment[], plainText: string } => {
  const { sessionRecording, project, workspace } = params

  if (!sessionRecording) {
    throw new Error('Invalid session recording')
  }

  if (!workspace || !project) {
    throw new Error('Invalid workspace or project')
  }

  const userAttributes = sessionRecording?.userAttributes || {}
  const sessionAttributes = sessionRecording?.sessionAttributes || {}
  const resourceAttributes = (sessionRecording?.resourceAttributes || {}) as any

  const endUserName =
    userAttributes?.name
    || userAttributes?.userName
    || sessionAttributes?.userName
    || userAttributes?.accountName
    || sessionAttributes?.accountName
    || workspace?.name
    || 'Unknown User'

  const endUserEmail =
    userAttributes?.userEmail
    || sessionAttributes?.userEmail
    || undefined

  const startedAt = sessionRecording?.startedAt ? new Date(sessionRecording.startedAt) : undefined
  const stoppedAt = sessionRecording?.stoppedAt ? new Date(sessionRecording.stoppedAt) : undefined

  const durationInSeconds =
    sessionRecording?.durationInSeconds
    ?? (startedAt && stoppedAt
      ? Math.max(0, (stoppedAt.getTime() - startedAt.getTime()) / 1000)
      : undefined)

  const durationStr = formatDuration(durationInSeconds)

  const osInfo = resourceAttributes?.osInfo
  const browserInfo = resourceAttributes?.browserInfo
  const deviceInfo = resourceAttributes?.deviceInfo
  const deviceBits = [osInfo, browserInfo, deviceInfo].filter(Boolean)
  const deviceDisplay = deviceBits.length ? deviceBits.join(' \u00b7 ') : undefined

  const openUrl = sessionRecording?.url
  const creationReason = sessionRecording?.creationReason || DebugSessionCreationReasonType.AUTO
  const headerLabel = HEADER_BY_REASON[creationReason] || HEADER_BY_REASON[DebugSessionCreationReasonType.AUTO]
  const issueCount = Array.isArray(sessionRecording?.issues) ? sessionRecording.issues.length : 0

  const dateDisplay = startedAt ? formatShortDate(startedAt) : 'Unknown Date'
  const description = `${endUserName}'s session on ${dateDisplay}`

  const plainText = headerLabel

  const detailLines: string[] = []

  if (durationStr) {
    detailLines.push(`*Duration* ${durationStr}`)
  }

  if (startedAt) {
    detailLines.push(`*Started* ${formatFullTimestamp(startedAt)}`)
  }

  if (deviceDisplay) {
    detailLines.push(`*Device* ${deviceDisplay}`)
  }

  const userParts = [endUserName, endUserEmail].filter(Boolean)
  if (userParts.length) {
    detailLines.push(`*User* ${userParts.join(' \u00b7 ')}`)
  }

  if (creationReason === DebugSessionCreationReasonType.ISSUE && issueCount > 0) {
    detailLines.push(`*Triggered by* ${issueCount} linked issue${issueCount > 1 ? 's' : ''}`)
  }

  const attachmentBlocks: (SectionBlock | ActionsBlock)[] = []

  attachmentBlocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `*${description}*` },
  })

  if (detailLines.length) {
    attachmentBlocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: detailLines.join('\n') },
    })
  }

  if (openUrl) {
    const openBtn: Button = {
      type: 'button',
      text: { type: 'plain_text', text: 'Open Recording', emoji: true },
      url: openUrl,
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
      fallback: description,
      blocks: attachmentBlocks,
    },
  ]

  return { blocks, attachments, plainText }
}
