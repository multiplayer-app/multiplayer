import logger from '@multiplayer/logger'
import { AgentChatModel, AgentModel, IssueModel } from '@multiplayer/models'
import { AgentChatStatus, AgentEvents } from '@multiplayer/types'
import * as websocket from '../websocket'
import { sseBus } from '../services/sse-bus.service'
import { WebSocketHelper } from '../helpers'
import { timeoutChatNow } from '../services/chat-timeout.service'

/**
 * Sweeps chats stuck in an active status (Processing/Streaming). Runs at boot
 * and on a cron so recovery does not depend on in-memory timers or disconnect
 * handlers having survived a service restart:
 *
 *  - Agent doc missing → the chat is a zombie (dispatch/disconnect race,
 *    pre-deploy leftovers): fail it.
 *  - Agent disconnected → leave it; the agent sweep owns that path and reaps
 *    after the grace period (failing the chat then).
 *  - Agent connected but the persisted `respondBy` deadline passed → time the
 *    chat out (replaces the in-memory timer lost on restart).
 */
export const clearStuckProcessingChats = async () => {
  try {
    for await (const chat of AgentChatModel.findAgentChatCursor({
      status: [
        AgentChatStatus.Processing,
        AgentChatStatus.Streaming,
      ],
    })) {
      const chatId = chat._id.toString()
      const agent = await AgentModel.findById(chat.agent)

      if (agent) {
        const isConnected = await websocket.agentNamespaceHandler.isAgentConnected(agent)
        if (!isConnected) {
          // Disconnected agents are handled by clearStuckSocketsForAgents,
          // which applies the reconnect grace period before failing chats.
          continue
        }

        if (chat.respondBy && new Date(chat.respondBy).getTime() < Date.now()) {
          logger.warn(
            { chatId, agentId: agent._id.toString() },
            '[CHAT_WORKER] Persisted AI-response deadline passed — timing out chat',
          )
          await timeoutChatNow(
            chatId,
            agent._id.toString(),
            chat.workspace.toString(),
            chat.project.toString(),
          )
        }
        continue
      }

      logger.debug(
        {
          chatId,
        },
        '[CHAT_WORKER] Marking stuck processing chat as error (agent missing)',
      )

      const prior = await AgentChatModel.finalizeAgentChatStatus(
        chatId,
        AgentChatStatus.Error,
      )
      if (!prior) {
        continue
      }

      // Make the chat's issue dispatchable again — otherwise it stays
      // solution.inProgress forever and no agent ever picks it up.
      const componentHash = prior.metadata?.issue?.componentHash
      if (componentHash) {
        await IssueModel.bulkUpdateIssues(
          chat.workspace.toString(),
          chat.project.toString(),
          { componentHash: [componentHash] },
          {
            solution: {
              inProgress: false,
              fixWithAgentFailed: false,
              agent: undefined,
            },
          },
        )
      }

      const updated = await AgentChatModel.findAgentChatById(chatId)
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
