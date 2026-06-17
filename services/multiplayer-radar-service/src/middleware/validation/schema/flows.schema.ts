import { Joi } from '@multiplayer/util'

export const listFlowsMetadataSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    name: Joi.string(),
    componentNames: Joi.array().items(Joi.string()),
    environmentNames: Joi.array().items(Joi.string()),
    platformIds: Joi.array().items(Joi.string().hex().length(24)),
    tags: Joi.array().items(
      Joi.string().max(400).regex(/^(?<KEY>[^:]*):(?<VALUE>.+)$/),
    ).max(32),
  })
    .with('limit', 'skip')
    .with('skip', 'limit')
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .required(),
})

export const getFlowSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    flowId: Joi.string().required(),
  }).required(),
})

export const updateFlowMetadataSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    flowId: Joi.string().required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
  }).required(),
})

export const deleteFlowByIdSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    flowId: Joi.string().required(),
  }).required(),
})

export const addStarToFlowMetadataSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    flowId: Joi.string().required(),
  }).required(),
  body: Joi.object({
    starId: Joi.string().required(),
  }).required(),
})

export const removeStarFromFlowMetadataSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    flowId: Joi.string().required(),
  }).required(),
  body: Joi.object({
    starId: Joi.string().required(),
  }).required(),
})

export const listUniqueComponentsFromFlowsMetadataSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({}).required(),
})

export const bulkDeleteFlowsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    ids: Joi.array().items(Joi.string().hex().length(24)),
  }).required(),
})
