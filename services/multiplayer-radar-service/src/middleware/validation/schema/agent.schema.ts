import { Joi } from '@multiplayer/util'
import { AgentType } from '@multiplayer/types'


export const listAgentsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    type: Joi.string().valid(...Object.values(AgentType)),
  }).required(),
})

export const getAgentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    agentId: Joi.string().hex().length(24).required(),
  }).required(),
})
