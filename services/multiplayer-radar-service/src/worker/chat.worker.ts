import logger from '@multiplayer/logger'
import { AgentChatModel, AgentModel } from '@multiplayer/models'
import { AgentChatStatus, AgentEvents } from '@multiplayer/types'
import * as websocket from '../websocket'
import { sseBus } from '../services/sse-bus.service'
import { WebSocketHelper } from '../helpers'
import * as AgentService from '../services/agent.service'

export const clearStuckProcessingChats = async () => {
  try {
    for await (const chat of AgentChatModel.findAgentChatCursor({
      status: [
        AgentChatStatus.Processing,
        AgentChatStatus.Streaming,
      ],
    })) {
      const agent = await AgentModel.findById(chat.agent)
      if (agent) {
        const isConnected = await websocket.agentNamespaceHandler.isAgentConnected(agent)
        if (isConnected) {
          continue
        } else {
          await AgentService.disconnectAgent(agent)
        }
        continue
      }



      const chatId = chat._id.toString()
      logger.debug(
        {
          chatId,
        },
        '[CHAT_WORKER] Marking stuck processing chat as error',
      )

      const updated = await AgentChatModel.updateAgentChatById(
        chatId,
        {
          status: AgentChatStatus.Error,
        },
      )
      if (!updated) {
        continue
      }

      const chatRoom = WebSocketHelper.getChatRoom(chat.workspace.toString(), chat.project.toString(), chatId)
      websocket.io.to(chatRoom).emit(AgentEvents.AGENT_CHAT_UPDATE, updated)
      sseBus.publish(chatId, AgentEvents.AGENT_CHAT_UPDATE, updated)
    }
  } catch (error) {
    logger.error(error, '[CHAT_WORKER] Failed to clear stuck processing chats')
  }
}
