import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const getChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = req.params.chatId as string
    const agentChat = await AgentChatModel.findAgentChatByChatId(chatId)
    if (!agentChat) {
      throw new NotFoundError(ErrorMessage.CHAT_NOT_FOUND)
    }
    return res.status(200).json(agentChat)
  } catch (err) {
    return next(err)
  }
}
