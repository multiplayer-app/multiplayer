import { Joi } from '@multiplayer/util'
import { CommitType } from '@multiplayer/types'

export const listCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    after: Joi.date(),
  }).required(),
})

export const getCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    commitId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    message: Joi.string().required(),
    label: Joi.string(),
    type: Joi.string().valid(...Object.values(CommitType)).required(),
    entityCommits: Joi.array().items(Joi.string().hex().length(24)).unique().min(1).required(),
    workspaceUsers: Joi.array().items(Joi.string().hex().length(24)).unique().required(), //.min(1)
  }).required(),
})

export const updateCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    commitId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    message: Joi.string(),
    label: Joi.string(),
  }).required(),
})

export const deleteCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    commitId: Joi.string().hex().length(24).required(),
  }).required(),
})
