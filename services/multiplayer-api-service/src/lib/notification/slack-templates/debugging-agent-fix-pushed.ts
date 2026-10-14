import {
  IIssue,
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

export default (
  params: {
    issue: IIssue,
    project: IProject,
    workspace: IWorkspace,
    git: {
      branchName: string,
      branchUrl?: string,
      repositoryUrl: string,
      prUrl?: string,
      codeChanges?: { additions?: number, deletions?: number },
    },
    slackChannelOptions?: IAlertRule['actions'][number]['slack'],
  },
): {
  blocks: SectionBlock[],
  attachments: MessageAttachment[],
  plainText: string
} => {
  const { issue, project, workspace, git } = params

  if (!issue || !project || !workspace || !git) {
    throw new Error('Invalid params for debugging-agent-fix-pushed template')
  }

  const { title } = issue
  const { branchName, branchUrl, prUrl, codeChanges } = git
  const issueTitle = title || 'Untitled issue'

  const issueUrl = buildIssueUrl(issue)

  const plainText = 'Agent pushed a fix'

  const detailLines: string[] = []

  const branchDisplay = branchUrl ? `<${branchUrl}|${branchName}>` : branchName
  detailLines.push(`*Branch* ${branchDisplay}`)

  if (codeChanges) {
    const { additions = 0, deletions = 0 } = codeChanges
    detailLines.push(`*Changes* +${additions} / -${deletions} lines`)
  }

  const attachmentBlocks: (SectionBlock | ActionsBlock)[] = []

  attachmentBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${issueTitle}*`,
    },
  })

  if (detailLines.length) {
    attachmentBlocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: detailLines.join('\n') },
    })
  }

  const actionButtons: Button[] = []

  if (prUrl) {
    actionButtons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'View Pull Request', emoji: true },
      url: prUrl,
    })
  }

  if (issueUrl) {
    actionButtons.push({
      type: 'button',
      text: { type: 'plain_text', text: 'Open Issue', emoji: true },
      url: issueUrl,
    })
  }

  if (actionButtons.length) {
    attachmentBlocks.push({
      type: 'actions',
      elements: actionButtons,
    })
  }

  const blocks: SectionBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: plainText,
      },
    },
  ]

  const attachments: MessageAttachment[] = [
    {
      color: '#36a64f',
      fallback: issueTitle,
      blocks: attachmentBlocks,
    },
  ]

  return {
    blocks,
    attachments,
    plainText,
  }
}
