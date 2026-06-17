import { AgentChatModel, AgentModel } from '@multiplayer/models'
import { AgentChatStatus, AgentEvents } from '@multiplayer/types'
import logger from '@multiplayer/logger'
import { AgentSessionCache } from '../cache'
import { sseBus } from './sse-bus.service'
import * as websocket from '../websocket'
import {
  CHAT_AI_RESPONSE_TIMEOUT_MS,
  AGENT_CONSECUTIVE_TIMEOUT_LIMIT,
} from '../config'

interface TimerEntry {
  timer: NodeJS.Timeout
  agentId: string
  workspaceId: string
  projectId: string
}

const activeTimers = new Map<string, TimerEntry>()

/**
 * Arms an AI-response timeout for the given chat.
 * If the AI does not respond within CHAT_AI_RESPONSE_TIMEOUT_MS the chat is
 * marked as `timedout`, the agent's capacity slot is released, and consecutive
 * timeout tracking is updated for the agent.
 *
 * Safe to call multiple times for the same chatId — previous timer is replaced.
 */
export const armChatTimeout = (
  chatId: string,
  agentId: string,
  workspaceId: string,
  projectId: string,
): void => {
  disarmChatTimeout(chatId)
  const timer = setTimeout(() => {
    void handleChatTimeout(chatId, agentId, workspaceId, projectId)
  }, CHAT_AI_RESPONSE_TIMEOUT_MS)
  activeTimers.set(chatId, { timer, agentId, workspaceId, projectId })

  logger.debug(
    { chatId, agentId, timeoutMs: CHAT_AI_RESPONSE_TIMEOUT_MS },
    '[CHAT_TIMEOUT] Armed AI-response timeout',
  )
}

/**
 * Cancels any pending timeout for the given chat.
 * Should be called as soon as the AI starts responding (first message or
 * terminal status update).
 */
export const disarmChatTimeout = (chatId: string): void => {
  const entry = activeTimers.get(chatId)
  if (!entry) return
  clearTimeout(entry.timer)
  activeTimers.delete(chatId)

  logger.debug({ chatId }, '[CHAT_TIMEOUT] Disarmed AI-response timeout')
}

/**
 * Resets the consecutive-timeout counter for an agent after a successful
 * (non-timeout) terminal event. Call this whenever a chat finishes, aborts, or
 * errors normally so that the counter does not carry over from old chats.
 */
export const resetAgentConsecutiveTimeouts = async (agentId: string): Promise<void> => {
  try {
    await AgentModel.resetConsecutiveTimeouts(agentId)
  } catch (err) {
    logger.error(err, '[CHAT_TIMEOUT] Failed to reset consecutive timeouts for agent')
  }
}

const handleChatTimeout = async (
  chatId: string,
  agentId: string,
  workspaceId: string,
  projectId: string,
): Promise<void> => {
  activeTimers.delete(chatId)

  logger.warn(
    { chatId, agentId, timeoutMs: CHAT_AI_RESPONSE_TIMEOUT_MS },
    '[CHAT_TIMEOUT] Chat timed out waiting for AI response',
  )

  try {
    // Mark the chat as timedout (only if it is still in an active state)
    const updated = await AgentChatModel.updateAgentChatById(chatId, {
      status: AgentChatStatus.Timedout,
    })

    if (!updated) {
      // Chat was already completed/deleted before the timer fired
      logger.debug({ chatId }, '[CHAT_TIMEOUT] Chat already resolved before timeout fired')
      return
    }

    // Release the capacity slot so the agent can accept new chats
    await AgentModel.releaseIssueCapacitySlot(agentId)
    await AgentSessionCache.unset(chatId)

    // Broadcast the timedout status to all subscribers
    websocket.agentNamespaceHandler.emitToChatRoom(
      workspaceId,
      projectId,
      chatId,
      AgentEvents.AGENT_CHAT_UPDATE,
      updated.toObject(),
    )
    sseBus.publish(chatId, AgentEvents.AGENT_CHAT_UPDATE, updated.toObject())

    // Increment consecutive timeout counter for the agent
    const agentAfterTimeout = await AgentModel.incrementConsecutiveTimeouts(agentId)

    if (
      agentAfterTimeout
      && (agentAfterTimeout.consecutiveTimeouts ?? 0) >= AGENT_CONSECUTIVE_TIMEOUT_LIMIT
    ) {
      await AgentModel.markAgentErrored(agentId)

      logger.warn(
        {
          agentId,
          consecutiveTimeouts: agentAfterTimeout.consecutiveTimeouts,
          limit: AGENT_CONSECUTIVE_TIMEOUT_LIMIT,
        },
        '[CHAT_TIMEOUT] Agent marked as errored after consecutive timeouts',
      )

      // Notify connected clients that the agent is now errored
      websocket.agentNamespaceHandler.emitMessageToRoom(
        workspaceId,
        projectId,
        '/',
        AgentEvents.DEBUGGING_AGENT_UPDATE,
        { ...agentAfterTimeout.toObject(), errored: true },
      )
    }
  } catch (err) {
    logger.error(err, '[CHAT_TIMEOUT] Error while handling chat timeout')
  }
}
