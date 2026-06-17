import type { Request, Response, NextFunction } from 'express'
import { NotFoundError, BadRequestError } from 'restify-errors'
import {
  IssueModel,
  AgentModel,
  DebugSessionModel,
} from '@multiplayer/models'
import {
  ErrorMessage,
  IssueGroupBy,
  AgentChatStartReasonEnum,
} from '@multiplayer/types'
import * as AgentService from '../../services/agent.service'

export const createChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const {
      agentId,
      context,
    } = req.body
    const issueComponentHash = context?.issue?.componentHash
    const debugSessionId = context?.debugSession?._id

    const agent = agentId
      ? await AgentModel.findAgentByIdAndProjectAndWorkspace(agentId, projectId, workspaceId)
      : await AgentModel.findAgentWithAvailableSlot({ workspaceId, projectId })


    if (!agent) {
      throw new BadRequestError('No available agent of the requested type')
    }


    if (issueComponentHash) {
      const { data: [issue] } = await IssueModel.findIssues(
        {
          workspace: workspaceId,
          project: projectId,
          componentHash: issueComponentHash,
        },
        { skip: 0, limit: 1 },
        undefined,
        IssueGroupBy.COMPONENT_HASH,
      )

      if (!issue) {
        throw new NotFoundError(ErrorMessage.ISSUE_NOT_FOUND)
      }

      const agentChat = await AgentService.notifyDebuggingAgentToFixIssue(
        agent,
        issue,
        AgentChatStartReasonEnum.MANUAL,
      )

      if (!agentChat) {
        throw new BadRequestError('Failed to create agent chat')
      }

      return res.status(200).json(agentChat.toJSON())
    }

    if (debugSessionId) {
      const debugSession = await DebugSessionModel.findDebugSessionByIdAndProjectAndWorkspace(
        debugSessionId,
        projectId,
        workspaceId,
      )

      if (!debugSession) {
        throw new NotFoundError('Debug session not found')
      }
    }

    const agentChat = await AgentService.startAgentChatWithoutIssue(
      agent,
      {
        startedByWorkspaceUserId: req.context?.workspaceUserId,
        debugSessionId,
      },
    )

    return res.status(200).json(agentChat.toJSON())
  } catch (err) {
    return next(err)
  }
}
