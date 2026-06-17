import { Joi } from '@multiplayer/util'

export const listPlatformsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    key: Joi.string(),
    text: Joi.string(),
    environmentNames: Joi.array().items(Joi.string()),
    tags: Joi.array().items(
      Joi.string().max(400).regex(/^(?<KEY>[^:]*):(?<VALUE>.+)$/),
    ).max(32),
    default: Joi.boolean(),
  })
    .with('limit', 'skip')
    .with('skip', 'limit')
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .required(),
})
