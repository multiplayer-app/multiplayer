import { Joi } from '@multiplayer/util'
import { SortOrder } from '@multiplayer/models'
import {
  ThreadStatus,
  ObjectTypeEnum,
} from '@multiplayer/types'

export const listThreadsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    search: Joi.string().max(100),
    branchId: Joi.string().hex().length(24),
    objectId: Joi.string().hex().length(24),
    objectType: Joi.string().valid(...Object.values(ObjectTypeEnum)),
    status: Joi.string().valid(...Object.values(ThreadStatus)),
    skip: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1).max(100),
    sortOrder: Joi.string().valid(...Object.values(SortOrder)),
    branchOnly: Joi.boolean(),
  }).required(),
})

export const getThreadSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    threadId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createThreadSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    branch: Joi.string().hex().length(24)
      .when('objectType', {
        is: [ObjectTypeEnum.ENTITY],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    objectId: Joi.string().hex().length(24),
    objectType: Joi.string().valid(...Object.values(ObjectTypeEnum)),
    commentablePath: Joi.array().items(Joi.string()),
    position: Joi.array().items(Joi.number()),
    content: Joi.string().required(),
  }).required(),
})

export const updateThreadSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    threadId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    status: Joi.string().valid(...Object.values(ThreadStatus)),
    commentablePath: Joi.array().items(Joi.string()),
    position: Joi.array().items(Joi.number()),
  }).or('commentablePath', 'position', 'status').required(),
})

export const deleteThreadSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    threadId: Joi.string().hex().length(24).required(),
  }).required(),
})
