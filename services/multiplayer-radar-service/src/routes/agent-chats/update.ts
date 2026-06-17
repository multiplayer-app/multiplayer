import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import {
  ErrorMessage,
  AgentEvents,
} from '@multiplayer/types'
import { agentNamespaceHandler } from '../../websocket'

export const updateChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = req.params.chatId as string
    const agentChat = await AgentChatModel.updateAgentChatById(chatId, req.body)
    if (!agentChat) {
      throw new NotFoundError(ErrorMessage.CHAT_NOT_FOUND)
    }

    agentNamespaceHandler.emitToChatRoom(
      agentChat.workspace,
      agentChat.project,
      chatId,
      AgentEvents.AGENT_CHAT_UPDATE,
      agentChat.toObject(),
    )

    return res.status(200).json(agentChat)
  } catch (err) {
    return next(err)
  }
}
