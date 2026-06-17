import { Joi } from '@multiplayer/util'
import { SortOrder } from '@multiplayer/models'
import {
  ThreadStatus,
  ObjectTypeEnum,
} from '@multiplayer/types'

export const listCommentsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    threadId: Joi.string().hex().length(24),
    objectId: Joi.string().hex().length(24),
    objectType: Joi.string().valid(...Object.values(ObjectTypeEnum)),
    branchId: Joi.string().hex().length(24),
    skip: Joi.number().integer().min(0).max(1000),
    limit: Joi.number().integer().min(0),
    sortOrder: Joi.string().valid(...Object.keys(SortOrder)),
    status: Joi.string().valid(...Object.keys(ThreadStatus)),
  }).required(),
})

export const getCommentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    commentId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createCommentSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    threadId: Joi.string().hex().length(24).required(),
    content: Joi.string().required(),
  }).required(),
})

export const updateCommentSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().required(),
  }).required(),
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    commentId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteCommentSchema = Joi.object({
  params: Joi.object({
    commentId: Joi.string().hex().length(24).required(),
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})
