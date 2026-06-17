import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel } from '@multiplayer/models'

export const getArtifacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chatId = req.params.chatId as string

    const agentChat = await AgentChatModel.findAgentChatByChatId(chatId)
    if (!agentChat) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const artifacts = agentChat.git?.codeChanges
      ? [{ type: 'codeChanges', data: agentChat?.git?.codeChanges }]
      : []

    return res.status(200).json(artifacts)
  } catch (err) {
    return next(err)
  }
}
