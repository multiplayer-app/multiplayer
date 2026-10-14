import { Joi } from '@multiplayer/util'

export const deletePlatformRelationsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    platformEntityId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    sourceEntity: Joi.string().hex().length(24).required(),
    targetEntity: Joi.string().hex().length(24),
  }).required(),
})


export const createPlatformRelationSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    platformEntityId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    sourceEntity: Joi.string().hex().length(24).required(),
    targetEntity: Joi.string().hex().length(24).required(),
  }).required(),
})


export const listPlatformRelationsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    platformEntityId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})
