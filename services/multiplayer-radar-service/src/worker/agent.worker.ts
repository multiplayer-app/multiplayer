import logger from '@multiplayer/logger'
import {
  AgentModel,
} from '@multiplayer/models'
import * as websocket from '../websocket'
import * as AgentService from '../services/agent.service'

export const clearStuckSocketsForAgents = async () => {
  try {
    for await (const agent of AgentModel.findAgentsCursor()) {
      if ((await websocket.agentNamespaceHandler.isAgentConnected(agent))) {
        continue
      }

      logger.info(
        {
          agentId: agent._id.toString(),
          socketId: agent.socketId,
        },
        '[AGENT_CHECK] Removing stuck agent',
      )
      await AgentService.disconnectAgent(agent)
    }
  } catch (error) {
    logger.error(error, '[AGENT_WORKER] Failed to clear stuck agents')
  }
}
