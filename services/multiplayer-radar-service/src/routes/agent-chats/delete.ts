import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel, AgentModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import {
  ErrorMessage,
  AgentEvents,
  AgentEventsMap,
  AgentChatStatus,
} from '@multiplayer/types'
import { agentNamespaceHandler } from '../../websocket'
import { WebSocketHelper } from '../../helpers'

export const deleteChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = req.params.chatId as string
    const agentChat = await AgentChatModel.findAgentChatByChatId(chatId)

    if (!agentChat) {
      throw new NotFoundError(ErrorMessage.CHAT_NOT_FOUND)
    }

    const workspace = agentChat.workspace.toString()
    const project = agentChat.project.toString()
    const agentId = agentChat.agent.toString()

    const payload = {
      _id: agentChat._id.toString(),
      workspace,
      project,
    } as AgentEventsMap[AgentEvents.AGENT_CHAT_DELETE]['responseParams']

    agentNamespaceHandler.emitMessageToRoom(
      workspace,
      project,
      '/',
      AgentEvents.AGENT_CHAT_DELETE,
      payload,
    )

    agentNamespaceHandler.emitMessageToRoom(
      workspace,
      project,
      WebSocketHelper.getAgentRoomInProject(workspace, project, agentId),
      AgentEvents.AGENT_CHAT_DELETE,
      payload,
    )

    if (
      agentChat.status === AgentChatStatus.Processing
      || agentChat.status === AgentChatStatus.Streaming
    ) {
      await AgentModel.releaseIssueCapacitySlot(agentId)
    }

    await AgentChatModel.deleteOne({ _id: agentChat._id })
    return res.status(204).send()
  } catch (err) {
    return next(err)
  }
}
