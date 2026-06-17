import { IIssue, AgentChatStartReasonEnum } from '@multiplayer/types'
import { IIssueDocument } from '@multiplayer/models'

export const getChatTitle = (params: {
  issue?: IIssue | IIssueDocument,
  startReason?: AgentChatStartReasonEnum
}): string => {
  if (params?.issue) {
    return `Solving issue: ${params.issue.title}`
  }

  if (params.startReason === AgentChatStartReasonEnum.MANUAL) {
    return 'Manual session'
  }

  return 'Session'
}
