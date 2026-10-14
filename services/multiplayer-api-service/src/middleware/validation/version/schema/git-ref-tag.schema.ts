import { Joi } from '@multiplayer/util'
import {
  GitRefTagType,
  SystemTag,
  IntegrationTypeEnum,
} from '@multiplayer/types'
import { gitRefSchema } from './shared/git-ref.schema'

export const listGitRefTagsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    gitRefRepositoryId: Joi.string(),
    gitRefType: Joi.string().valid(...Object.values(IntegrationTypeEnum)),
    projectBranch: Joi.string().hex().length(24),
    gitRefBranch: Joi.string(),
    gitRefPath: Joi.string(),
    archived: Joi.boolean(),
    type: Joi.string().valid(...Object.values(GitRefTagType)),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})
export const getChangedGitRefTagsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const getGitRefTagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    gitRefTagId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createGitRefTagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    archived: Joi.boolean(),
    type: Joi.string().valid(...Object.values(GitRefTagType)).required(),
    gitRef: gitRefSchema.required(),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    systemTags: Joi.array().items(Joi.string().valid(...Object.values(SystemTag))),
  }).required(),
})

export const updateGitRefTagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    gitRefTagId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    tags: Joi.array().items(Joi.object({
      key: Joi.string().max(200),
      value: Joi.string().max(200).required(),
    })).max(32),
    systemTags: Joi.array().items(Joi.string().valid(...Object.values(SystemTag))),
  }).required(),
})

export const deleteGitRefTagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    gitRefTagId: Joi.string().hex().length(24).required(),
  }).required(),
})
