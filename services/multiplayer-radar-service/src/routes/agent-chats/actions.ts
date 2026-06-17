import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel } from '@multiplayer/models'
import { WebSocketHelper } from '../../helpers'
import * as websocket from '../../websocket'

export const postChatAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const chatId = req.params.chatId as string

    const body = req.body ?? {}
    const { kind, toolCallId, action, data, systemMessage } = body

    if (!kind || !toolCallId || !action) {
      return res.status(400).json({ message: 'kind, toolCallId and action are required' })
    }

    const session = await AgentChatModel.findAgentChatByChatId(chatId)
    if (!session) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const agentRoom = WebSocketHelper.getAgentRoomInProject(workspaceId, projectId, session.agent.toString())
    websocket.agentNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      agentRoom,
      'agent:action',
      {
        chatId,
        kind,
        toolCallId,
        action,
        data: data ?? {},
        systemMessage,
      },
    )

    return res.status(200).json({ ok: true })
  } catch (err) {
    return next(err)
  }
}
