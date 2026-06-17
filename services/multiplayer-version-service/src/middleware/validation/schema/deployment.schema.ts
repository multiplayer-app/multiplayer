import { Joi } from '@multiplayer/util'

export const getDeploymentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    deploymentId: Joi.string().hex().length(24).required(),
  }),
})

export const listDeploymentsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    skip: Joi.number().integer().min(0).max(1000),
    limit: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    entity: Joi.string().hex().length(24),
    environment: Joi.string().hex().length(24),
  })
    .with('limit', 'skip')
    .with('skip', 'limit')
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .required(),
})

export const createDeploymentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    entity: Joi.string().hex().length(24).required(),
    release: Joi.string().hex().length(24).required(),
    environment: Joi.string().hex().length(24).required(),
  }),
})
