import { Joi } from '@multiplayer/util'

export const listTagsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const getTagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    tagId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createTagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string(),
  }).required(),
})

export const updateTagSchema = Joi.object({
  body: Joi.object({
    archived: Joi.boolean(),
    name: Joi.string(),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    tagId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteTagSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    tagId: Joi.string().hex().length(24).required(),
  }).required(),
})
