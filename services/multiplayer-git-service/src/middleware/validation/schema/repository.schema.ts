import { Joi } from '@multiplayer/util'

export const listRepositoriesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    page: Joi.number().min(1),
    perPage: Joi.number().min(10),
  }),
})
