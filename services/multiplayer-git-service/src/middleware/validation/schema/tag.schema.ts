import { Joi } from '@multiplayer/util'

export const listTagsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
    repositoryId: Joi.string().required(),
  }),
  query: Joi.object({
    page: Joi.number().min(1),
    perPage: Joi.number().min(10),
  }),
})
