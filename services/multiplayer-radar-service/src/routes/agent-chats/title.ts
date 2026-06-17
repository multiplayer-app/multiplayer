import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel, AgentChatMessageModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const generateTitle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const { chatId } = req.body ?? {}
    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' })
    }

    const session = await AgentChatModel.findAgentChatByChatId(chatId)
    if (!session) {
      throw new NotFoundError(ErrorMessage.CHAT_NOT_FOUND)
    }

    const messages = await AgentChatMessageModel.findMessages({
      workspace: workspaceId,
      project: projectId,
      chat: session._id,
    }, {
      skip: 0,
      limit: 1,
    })
    const firstMessage = messages.data[0]
    const title = firstMessage
      ? firstMessage?.content?.slice(0, 60).trim()
      : `Session ${session._id.toString().slice(-6)}`

    return res.status(200).json({ title })
  } catch (err) {
    return next(err)
  }
}
