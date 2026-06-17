import { Joi } from '@multiplayer/util'
import { ProjectBranchReviewState } from '@multiplayer/types'

export const addBranchReviewSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    comment: Joi.string().allow(''),
    state: Joi.string().valid(...Object.values(ProjectBranchReviewState)).required(),
  }).required(),
})

export const listBranchReviewsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(100),
    skip: Joi.number().integer().min(0),
  }),
})

export const updateBranchReviewSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    comment: Joi.string().allow(''),
    state: Joi.string().valid(...Object.values(ProjectBranchReviewState)).required(),
  }).required(),
})

export const inviteBranchReviewerSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    workspaceUsers: Joi.array().items(Joi.string().hex().length(24).required()).empty(Joi.array().length(0)),
    emails: Joi.array().items(Joi.string().email()).empty(Joi.array().length(0)),
  }).required(),
})

export const removeBranchReviewerSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    workspaceUser: Joi.string().hex().length(24).required(),
  }).required(),
})
