import { Joi } from '@multiplayer/util'

export const getSessionNoteSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
})
export const getSessionNoteUpdateSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
    updateId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createSessionNoteSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteSessionNoteSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getSessionNoteFileSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    debugSessionId: Joi.string().hex().length(24).required(),
    blockId: Joi.string().required(),
  }).required(),
})
