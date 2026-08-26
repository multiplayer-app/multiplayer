import { Joi } from '@multiplayer/util'

export const listAllTagsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    // limit: Joi.number().integer().min(1).max(1000),
    // skip: Joi.number().integer().min(0),
  }).required(),
})
