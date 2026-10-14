import { Joi } from '@multiplayer/util'

export const getGitRepositoryTreeSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().required(),
    path: Joi.string().required(),
  }),
  query: Joi.object({
    ref: Joi.string().required(),
    page: Joi.string(),
    perPage: Joi.number().min(10),
  }),
})

export const getGitRepositoryTreeByGitIdSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitId: Joi.string().required(),
    path: Joi.string().required(),
  }),
  query: Joi.object({
    ref: Joi.string().required(),
    page: Joi.string(),
    perPage: Joi.number().min(10),
  }),
})
