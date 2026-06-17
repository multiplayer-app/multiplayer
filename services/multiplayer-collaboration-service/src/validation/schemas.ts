import { Joi } from '@multiplayer/util'
import { EntityType, IntegrationTypeEnum } from '@multiplayer/types'

export const resetEntitySchema = Joi.array().ordered(
  Joi.object({
    entityId: Joi.string().hex().length(24).required(),
    branchId: Joi.string().hex().length(24).required(),
    entityCommitId: Joi.string().hex().length(24).required(),
  }).required(),
).items(Joi.any()).min(1).max(2).required()

export const copyEntitySchema = Joi.array().ordered(
  Joi.object({
    entityId: Joi.string().hex().length(24).required(),
    branchId: Joi.string().hex().length(24).required(),
    entityCommitId: Joi.string().hex().length(24).required(),
    entityName: Joi.string().max(100),
  }).required(),
).items(Joi.any()).min(1).max(2).required()

export const createEntitySchema = Joi.array().ordered(
  Joi.object({
    gitRef: Joi.object({
      repositoryType: Joi.string().valid(...Object.values(IntegrationTypeEnum)).required(),
      repositoryId: Joi.string().required(),
      branch: Joi.string(),
      path: Joi.string(),
      repositoryName: Joi.string().required(),
      repositoryOwner: Joi.string().required(),
    }),
    metaSummary: Joi.object().pattern(Joi.string(), Joi.string()),
    key: Joi.string().required(),
    type: Joi.string().valid(...Object.values(EntityType)).required(),
    branchId: Joi.string().hex().length(24).required(),
  }).required(),
).items(Joi.any()).min(1).max(2).required()

export const updateEntitySchema = Joi.array().ordered(
  Joi.object({
    entityName: Joi.string(),
    summary: Joi.object().pattern(Joi.string(), Joi.string()),
    entityId: Joi.string().hex().length(24).required(),
    branchId: Joi.string().hex().length(24).required(),
  }).required(),
).items(Joi.any()).min(1).max(2).required()

export const commitEntitySchema = Joi.array().ordered(
  Joi.object({
    entityId: Joi.string().hex().length(24).required(),
    branchId: Joi.string().hex().length(24).required(),
    message: Joi.string(),
    label: Joi.string(),
  }).required(),
).items(Joi.any()).min(1).max(2).required()

export const gitCommitEntitySchema = Joi.array().ordered(
  Joi.object({
    entityIds: Joi.array().items(Joi.string().hex().length(24).required()).min(1).required(),
    branchId: Joi.string().hex().length(24).required(),
    commitMessage: Joi.string(),
  }).required(),
).items(Joi.any()).min(1).max(2).required()

export const deleteEntitySchema = Joi.array().ordered(
  Joi.object({
    entityId: Joi.string().hex().length(24).required(),
    branchId: Joi.string().hex().length(24).required(),
  }).required(),
).items(Joi.any()).min(1).max(2).required()
