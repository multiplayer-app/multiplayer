import { Joi } from '@multiplayer/util'
import { IntegrationTypeEnum } from '@multiplayer/types'

export const listGitRepositoriesInProjectSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    gitRepositoryType: Joi.string().valid(...Object.keys(IntegrationTypeEnum)),
    gitRepositoryName: Joi.string(),
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const listGitRepositoriesInWorkspaceSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    gitRepositoryType: Joi.string().valid(...Object.keys(IntegrationTypeEnum)),
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const getGitRepositorySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createGitRepositorySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    gitRepositoryType: Joi.string().valid(...Object.keys(IntegrationTypeEnum)),
    gitRepositoryId: Joi.string(),
    archived: Joi.boolean(),
    url: Joi.string().uri(),
  })
    .xor('url', 'gitRepositoryId')
    .xor('url', 'gitRepositoryType')
    .required(),
})

export const updateGitRepositorySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
  }).required(),
})

export const deleteGitRepositorySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const bulkUpdateGitRepositorySchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    gitRepositoryType: Joi.string().valid(...Object.keys(IntegrationTypeEnum)).required(),
    gitRepositoryId: Joi.string().required(),
    archived: Joi.boolean(),
    projects: Joi.array().items(Joi.string().hex().length(24)).required(),
  }).required(),
})

export const getGitRepositoryByGitIdSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitId: Joi.string().required(),
  }).required(),
})
