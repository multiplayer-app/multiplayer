import { Joi } from '@multiplayer/util'
import { IssueCategoryEnum } from '@multiplayer/types'

export const getGlobalIssuesSettingsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const updateGlobalIssuesSettingsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    createOnlyForCategories: Joi.array().items(
      Joi.string().valid(...Object.values(IssueCategoryEnum)),
    ),
  }).required(),
})
