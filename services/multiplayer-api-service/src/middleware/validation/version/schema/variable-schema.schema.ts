import { Joi } from '@multiplayer/util'
import {
  VariableSchemaEntityType,
  VariableSchemaType,
} from '@multiplayer/types'

export const listVariableSchemasSchema = Joi.object({
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
    type: Joi.string().valid(...Object.values(VariableSchemaType)),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getChangedVariableSchemasSchema = Joi.object({
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

export const getVariableSchemaSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    variableSchemaId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createVariableSchemaSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    entity: Joi.string().hex().length(24).required(),
    entityType: Joi.string().valid(...Object.values(VariableSchemaEntityType)).required(),
    type: Joi.string().valid(...Object.values(VariableSchemaType)).required(),
    name: Joi.string().required(),
    description: Joi.string(),
    defaultValue: Joi.string(),
    required: Joi.boolean(),
    archived: Joi.boolean(),
  }).required(),
})

export const updateVariableSchemaSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    variableSchemaId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    description: Joi.string(),
    defaultValue: Joi.string(),
    required: Joi.boolean(),
    archived: Joi.boolean(),
  }).required(),
})

export const deleteVariableSchemaSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    variableSchemaId: Joi.string().hex().length(24).required(),
  }).required(),
})
