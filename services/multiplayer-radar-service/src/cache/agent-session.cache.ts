import redis, { client as redisClient } from '@multiplayer/redis'
import {
  REDIS_AGENT_SESSION_PREFIX,
  REDIS_AGENT_SESSION_TTL,
} from '../config'

// agent_session:{chatId} -> agentId
const getChatKey = (chatId: string) => `${REDIS_AGENT_SESSION_PREFIX}${chatId}`
// agent_session:agent:{agentId} -> Set<chatId>
const getAgentSetKey = (agentId: string) => `${REDIS_AGENT_SESSION_PREFIX}agent:${agentId}`

export const set = async (agentId: string, chatId: string): Promise<void> => {
  await redis.set(getChatKey(chatId), agentId, REDIS_AGENT_SESSION_TTL)
  await redisClient.sAdd(getAgentSetKey(agentId), chatId)
}

export const getByChat = async (chatId: string): Promise<string | undefined> => {
  return await redis.get(getChatKey(chatId)) as string | undefined
}

export const unset = async (chatId: string): Promise<void> => {
  const agentId = await getByChat(chatId)
  await redis.del(getChatKey(chatId))
  if (agentId) {
    await redisClient.sRem(getAgentSetKey(agentId), chatId)
  }
}

export const unsetByAgent = async (agentId: string): Promise<void> => {
  const chatIds = await redisClient.sMembers(getAgentSetKey(agentId))
  const keysToDelete: string[] = chatIds.map(getChatKey)
  keysToDelete.push(getAgentSetKey(agentId))
  await redis.del(keysToDelete)
}
