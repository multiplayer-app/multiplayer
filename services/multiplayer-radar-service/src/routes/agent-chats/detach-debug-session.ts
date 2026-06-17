import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { AgentChatModel } from '@multiplayer/models'

export const detachDebugSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = req.params.chatId as string
    const debugSessionId = req.params.debugSessionId as string

    const chat = await AgentChatModel.findAgentChatById(chatId)
    if (!chat) {
      throw new NotFoundError('Chat not found')
    }

    // $pull is idempotent — no error if the session wasn't attached
    const updatedChat = await AgentChatModel.pullAttachedDebugSession(chatId, debugSessionId)

    return res.status(200).json(updatedChat?.toJSON())
  } catch (err) {
    return next(err)
  }
}
