import type { Request, Response, NextFunction } from 'express'
import { AgentChatModel } from '@multiplayer/models'
import { WebSocketHelper } from '../../helpers'
import * as websocket from '../../websocket'

export const abortMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const chatId = req.params.chatId as string

    const session = await AgentChatModel.findAgentChatByChatId(chatId)
    if (!session) {
      return res.status(404).json({ message: 'Chat not found' })
    }

    const agentRoom = WebSocketHelper.getAgentRoomInProject(workspaceId, projectId, session.agent.toString())
    websocket.agentNamespaceHandler.emitMessageToRoom(
      workspaceId,
      projectId,
      agentRoom,
      'agent:abort',
      { chatId },
    )

    return res.status(200).json({ message: 'Agent process stop requested successfully' })
  } catch (err) {
    return next(err)
  }
}
