import type { Request, Response, NextFunction } from 'express'
import {
  // AgentChatModel,
  SessionNoteModel,
} from '@multiplayer/models'
// import { AgentChatMessageRole, AgentEvents, AgentEventsMap } from '@multiplayer/types'
// import { ObjectId } from '@multiplayer/mongo'
// import { AgentChatMessageModel } from '@multiplayer/models'
// import * as websocket from '../../websocket'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSessionId = req.params.debugSessionId as string

    // const affectedChats = await AgentChatModel.findChatsWithDebugSession(debugSessionId)

    await SessionNoteModel.deleteSessionNote(debugSessionId)

    // Notify each affected chat that session notes were removed
    // await Promise.all(
    //   affectedChats.map(async (chat) => {
    //     const workspaceId = chat.workspace.toString()
    //     const projectId = chat.project.toString()
    //     const chatId = chat._id.toString()

    //     const message = await AgentChatMessageModel.createMessage({
    //       workspace: workspaceId,
    //       project: projectId,
    //       chat: chatId,
    //       role: AgentChatMessageRole.Assistant,
    //       agentName: 'context',
    //       content: 'Session notes for an attached recording were removed.',
    //     })

    //     websocket.agentNamespaceHandler.emitToChatRoom(
    //       workspaceId,
    //       projectId,
    //       chatId,
    //       AgentEvents.AGENT_MESSAGE_NEW,
    //       message.toObject() as AgentEventsMap[AgentEvents.AGENT_MESSAGE_NEW]['responseParams'],
    //     )
    //   }),
    // )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
