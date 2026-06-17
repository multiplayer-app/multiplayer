import { Joi } from '@multiplayer/util'
import {
  SystemTag,
} from '@multiplayer/types'

export const listEnvironmentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getChangedEnvironmentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getEnvironmentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    environmentId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createEnvironmentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string().required(),
    defaultVariables: Joi.array().items(Joi.object({
      variableName: Joi.string().required(),
      value: Joi.string().required(),
    })),
    tags: Joi.array().items(Joi.string().hex().length(24)),
    systemTags: Joi.array().items(Joi.string().valid(...Object.values(SystemTag))),
  }).required(),
})

export const updateEnvironmentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    environmentId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string().required(),
    variables: Joi.array().items(Joi.object({
      variableName: Joi.string().required(),
      value: Joi.string().required(),
    })),
    tags: Joi.array().items(Joi.string().hex().length(24)),
    systemTags: Joi.array().items(Joi.string().valid(...Object.values(SystemTag))),
  }).required(),
})

export const deleteEnvironmentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    environmentId: Joi.string().hex().length(24).required(),
  }).required(),
})
