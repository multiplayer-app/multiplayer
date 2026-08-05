import { Joi } from '@multiplayer/util'
import { EntityType } from '@multiplayer/types'

export const listVariableValuesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    entity: Joi.string().hex().length(24).required(),
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getChangedVariableValuesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    entity: Joi.string().hex().length(24).required(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getVariableValueSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    variableValueId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createVariableValueSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    entity: Joi.string().hex().length(24).required(),
    environment: Joi.string().hex().length(24).required(),
    variableSchema: Joi.string().hex().length(24).required(),
    value: Joi.string().required(),
    archived: Joi.boolean(),
  }).required(),
})

export const updateVariableValueSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    variableValueId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    value: Joi.string().required(),
    archived: Joi.boolean(),
  }).required(),
})

export const deleteVariableValueSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    variableValueId: Joi.string().hex().length(24).required(),
  }).required(),
})
