import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'
import { WebSocketHelper } from '../../helpers'
import * as websocket from '../../websocket'

export const patchToolCall = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const chatId = req.params.chatId as string
    const messageId = req.params.messageId as string
    const toolCallId = req.params.toolCallId as string

    const { input, output, status } = req.body ?? {}

    const chat = await AgentChatModel.findAgentChatByChatId(chatId)
    if (!chat) {
      throw new NotFoundError(ErrorMessage.CHAT_NOT_FOUND)
    }

    const agentRoom = WebSocketHelper.getAgentRoomInProject(workspaceId, projectId, chat.agent.toString())
    websocket.agentNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      agentRoom,
      'agent:tool-call:update',
      {
        chatId,
        messageId,
        toolCallId,
        ...(input !== undefined ? { input } : {}),
        ...(output !== undefined ? { output } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    )

    return res.status(200).json({ ok: true })
  } catch (err) {
    return next(err)
  }
}
