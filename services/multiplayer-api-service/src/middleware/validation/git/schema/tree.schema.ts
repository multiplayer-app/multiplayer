import { Joi } from '@multiplayer/util'

export const getRepositoryTreeSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
    repositoryId: Joi.string().required(),
    path: Joi.string().required(),
  }),
  query: Joi.object({
    ref: Joi.string().required(),
    page: Joi.string(),
    perPage: Joi.number().min(10),
  }),
})
