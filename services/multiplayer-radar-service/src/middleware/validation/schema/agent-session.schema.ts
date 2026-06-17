import { Joi } from '@multiplayer/util'

export const listAgentSessionsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    status: Joi.string().valid('active', 'completed', 'failed'),
    agentId: Joi.string().hex().length(24),
  }).required(),
})

export const createAgentSessionSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    agentId: Joi.string().hex().length(24).required(),
  }).required(),
})
