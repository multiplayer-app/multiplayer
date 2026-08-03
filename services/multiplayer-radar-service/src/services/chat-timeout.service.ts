import { AgentChatModel, AgentModel, IssueModel } from '@multiplayer/models'
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
 * The deadline is persisted on the chat document (`respondBy`) so it survives
 * service restarts — the stuck-chat sweep enforces it when the in-memory timer
 * is gone. The local setTimeout is just the fast path.
 *
 * Safe to call multiple times for the same chatId — previous timer is replaced.
 */
export const armChatTimeout = (
  chatId: string,
  agentId: string,
  workspaceId: string,
  projectId: string,
): void => {
  cancelTimer(chatId)
  clearedDeadlines.delete(chatId)
  const timer = setTimeout(() => {
    void timeoutChatNow(chatId, agentId, workspaceId, projectId)
  }, CHAT_AI_RESPONSE_TIMEOUT_MS)
  activeTimers.set(chatId, { timer, agentId, workspaceId, projectId })

  void AgentChatModel.updateAgentChatById(chatId, {
    respondBy: new Date(Date.now() + CHAT_AI_RESPONSE_TIMEOUT_MS).toISOString(),
  }).catch((err) => {
    logger.error(err, '[CHAT_TIMEOUT] Failed to persist respondBy deadline')
  })

  logger.debug(
    { chatId, agentId, timeoutMs: CHAT_AI_RESPONSE_TIMEOUT_MS },
    '[CHAT_TIMEOUT] Armed AI-response timeout',
  )
}

/**
 * Cancels any pending timeout for the given chat and clears the persisted
 * deadline. Should be called as soon as the AI starts responding (first
 * message or terminal status update).
 */
const cancelTimer = (chatId: string): void => {
  const entry = activeTimers.get(chatId)
  if (!entry) return
  clearTimeout(entry.timer)
  activeTimers.delete(chatId)
}

// Chats whose persisted deadline this instance already cleared — avoids one
// DB write per streamed message chunk. Re-arming removes the entry again.
const clearedDeadlines = new Set<string>()

/**
 * Signals that the agent produced output for this chat: cancels the local
 * timer and clears the persisted `respondBy` deadline (once per arm cycle).
 * Call on every agent-originated message; debounced internally.
 */
export const noteAgentResponded = (chatId: string): void => {
  cancelTimer(chatId)

  if (clearedDeadlines.has(chatId)) return
  clearedDeadlines.add(chatId)
  if (clearedDeadlines.size > 10_000) {
    clearedDeadlines.clear()
    clearedDeadlines.add(chatId)
  }

  void AgentChatModel.updateAgentChatById(chatId, {
    respondBy: null,
  }).catch((err) => {
    logger.error(err, '[CHAT_TIMEOUT] Failed to clear respondBy deadline')
  })
}

export const disarmChatTimeout = (chatId: string): void => {
  cancelTimer(chatId)

  void AgentChatModel.updateAgentChatById(chatId, {
    respondBy: null,
  }).catch((err) => {
    logger.error(err, '[CHAT_TIMEOUT] Failed to clear respondBy deadline')
  })

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

/**
 * Times out a chat immediately: marks it `timedout`, releases the agent's
 * capacity slot, and updates consecutive-timeout tracking.
 *
 * Idempotent — finalizeAgentChatStatus only transitions chats that are still
 * active, so a chat that completed (or was already timed out by another
 * instance) is left untouched and no slot is double-released.
 *
 * Called by the in-memory timer AND by the stuck-chat sweep (which enforces
 * the persisted `respondBy` deadline after restarts).
 */
export const timeoutChatNow = async (
  chatId: string,
  agentId: string,
  workspaceId: string,
  projectId: string,
): Promise<void> => {
  activeTimers.delete(chatId)

  try {
    // Atomically transition active → timedout; null means the chat was
    // already resolved (or reaped elsewhere) — nothing to do.
    const prior = await AgentChatModel.finalizeAgentChatStatus(
      chatId,
      AgentChatStatus.Timedout,
    )
    if (!prior) {
      logger.debug({ chatId }, '[CHAT_TIMEOUT] Chat already resolved before timeout fired')
      return
    }

    logger.warn(
      { chatId, agentId, timeoutMs: CHAT_AI_RESPONSE_TIMEOUT_MS },
      '[CHAT_TIMEOUT] Chat timed out waiting for AI response',
    )

    // Release the capacity slot so the agent can accept new chats
    await AgentModel.releaseIssueCapacitySlot(agentId)
    await AgentSessionCache.unset(chatId)

    // Make the chat's issue dispatchable again — otherwise it stays
    // solution.inProgress forever and no agent ever picks it up.
    const componentHash = prior.metadata?.issue?.componentHash
    if (componentHash) {
      await IssueModel.bulkUpdateIssues(
        workspaceId,
        projectId,
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

    // Broadcast the timedout status to all subscribers
    const updated = await AgentChatModel.findAgentChatById(chatId)
    if (updated) {
      websocket.agentNamespaceHandler.emitToChatRoom(
        workspaceId,
        projectId,
        chatId,
        AgentEvents.AGENT_CHAT_UPDATE,
        updated.toObject(),
      )
      sseBus.publish(chatId, AgentEvents.AGENT_CHAT_UPDATE, updated.toObject())
    }

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
