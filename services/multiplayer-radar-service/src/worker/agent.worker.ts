import logger from '@multiplayer/logger'
import {
  AgentModel,
} from '@multiplayer/models'
import * as websocket from '../websocket'
import * as AgentService from '../services/agent.service'
import { AGENT_DISCONNECT_GRACE_MS } from '../config'

/**
 * Sweeps agents whose socket is gone. Agents get a grace period before the
 * hard reap (fail chats, release issues, delete the doc) so that transient
 * network blips and rolling deploys of this service — where every socket
 * drops and reconnects — don't kill in-flight work.
 *
 * The grace clock is `disconnectedAt` (written by the disconnect handler).
 * When the service died with the socket (no handler ran), it is unset — the
 * sweep starts the clock itself and reaps on a later pass.
 */
export const clearStuckSocketsForAgents = async () => {
  try {
    for await (const agent of AgentModel.findAgentsCursor()) {
      if ((await websocket.agentNamespaceHandler.isAgentConnected(agent))) {
        continue
      }

      if (!agent.disconnectedAt) {
        // No disconnect was recorded (service crash / deploy) — start the
        // grace clock now instead of reaping immediately.
        logger.info(
          { agentId: agent._id.toString(), socketId: agent.socketId },
          '[AGENT_CHECK] Agent socket gone without disconnect record — starting grace period',
        )
        await AgentModel.markAgentDisconnected(agent._id)
        continue
      }

      const disconnectedForMs = Date.now() - new Date(agent.disconnectedAt).getTime()
      if (disconnectedForMs < AGENT_DISCONNECT_GRACE_MS) {
        continue
      }

      logger.info(
        {
          agentId: agent._id.toString(),
          socketId: agent.socketId,
          disconnectedForMs,
        },
        '[AGENT_CHECK] Removing stuck agent (grace period expired)',
      )
      await AgentService.disconnectAgent(agent)
    }
  } catch (error) {
    logger.error(error, '[AGENT_WORKER] Failed to clear stuck agents')
  }
}
