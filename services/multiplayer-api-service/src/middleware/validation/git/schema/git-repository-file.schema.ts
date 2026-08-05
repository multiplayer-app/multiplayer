import { Joi } from '@multiplayer/util'

export const getGitRepositoryFileContentsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().required(),
    path: Joi.string().required(),
  }),
  query: Joi.object({
    ref: Joi.string().required(),
  }),
})

export const getGitRepositoryFileContentsByGitIdSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitId: Joi.string().required(),
    path: Joi.string().required(),
  }),
  query: Joi.object({
    ref: Joi.string().required(),
  }),
})
