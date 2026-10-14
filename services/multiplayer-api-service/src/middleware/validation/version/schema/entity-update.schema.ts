import { Joi } from '@multiplayer/util'

export const downloadEntityUpdate = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
    entityUpdateId: Joi.string().hex().length(24).required(),
  }).required(),
})


export const uploadEntityUpdate = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
    entityUpdateId: Joi.string().hex().length(24).required(),
  }).required(),
})