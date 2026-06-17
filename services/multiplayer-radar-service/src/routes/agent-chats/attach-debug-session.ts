import type { Request, Response, NextFunction } from 'express'
import { BadRequestError, NotFoundError } from 'restify-errors'
import { AgentChatModel, AgentChatMessageModel, DebugSessionModel } from '@multiplayer/models'
import { AgentChatMessageRole, AgentEvents, AgentEventsMap } from '@multiplayer/types'
import {
  getSessionNotesContext,
  injectSessionNotesContextMessage,
} from '../../services/session-notes-context.service'
import * as websocket from '../../websocket'

export const attachDebugSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const chatId = req.params.chatId as string
    const { debugSessionId } = req.body as { debugSessionId: string }

    if (!debugSessionId) {
      throw new BadRequestError('debugSessionId is required')
    }

    const [chat, debugSession] = await Promise.all([
      AgentChatModel.findAgentChatById(chatId),
      DebugSessionModel.findDebugSessionByIdAndProjectAndWorkspace(debugSessionId, projectId, workspaceId),
    ])

    if (!chat) {
      throw new NotFoundError('Chat not found')
    }

    if (!debugSession) {
      throw new NotFoundError('Debug session not found')
    }

    const updatedChat = await AgentChatModel.pushAttachedDebugSession(chatId, debugSessionId)

    // Inject notes context into chat immediately so the agent sees it
    const context = await getSessionNotesContext(debugSessionId)
    if (context && (context.notes.length > 0 || context.sketches.length > 0)) {
      await injectSessionNotesContextMessage({
        context,
        chatId,
        workspaceId,
        projectId,
      })
    }

    // Notify the CLI agent that a session recording was attached so it can
    // fetch the full debug context (traces, logs, rrweb) for this session.
    const notificationMessage = await AgentChatMessageModel.createMessage({
      workspace: workspaceId,
      project: projectId,
      chat: chatId,
      role: AgentChatMessageRole.Assistant,
      agentName: 'context',
      content: 'A session recording was attached.',
      annotations: {
        debugSessionId,
      },
    })

    websocket.agentNamespaceHandler.emitToChatRoom(
      workspaceId,
      projectId,
      chatId,
      AgentEvents.AGENT_MESSAGE_NEW,
      notificationMessage.toObject() as AgentEventsMap[AgentEvents.AGENT_MESSAGE_NEW]['responseParams'],
    )

    return res.status(200).json(updatedChat?.toJSON())
  } catch (err) {
    return next(err)
  }
}
