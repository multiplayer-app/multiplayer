import { Joi } from '@multiplayer/util'
import {
  EntityCommitStatus,
  EntityCommitChangeType,
  EntityCommitStorageType,
} from '@multiplayer/types'

export const listEntityCommitsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    commit: Joi.string().hex().length(24),
    name: Joi.string().max(100),
    namedOnly: Joi.boolean(),
  }).required(),
})

export const getEntityCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
    entityCommitId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getLatestEntityCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createEntityCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    changeType: Joi.string().valid(...Object.values(EntityCommitChangeType)).required(),
    storageType: Joi.string().valid(...Object.values(EntityCommitStorageType))
      .when('changeType', {
        is: EntityCommitChangeType.DELETE,
        then: Joi.forbidden(),
        otherwise: Joi.required(),
      }),
    meta: Joi.object({
      entityName: Joi.string(),
      links: Joi.array().items(Joi.string().hex().length(24)),
      summary: Joi.object().pattern(Joi.string(), Joi.string().allow('')),
    }),
  }).required(),
})
export const copyEntityCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
    entityCommitId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    entityName: Joi.string(),
  }).required(),
})

export const updateEntityCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
    entityCommitId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().max(100),
    status: Joi.string().valid(EntityCommitStatus.DONE, EntityCommitStatus.ERROR).required(),
  }).required(),
})
export const updateEntityCommitMetaSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
    entityCommitId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    entityName: Joi.string(),
  }).min(1).required(),

})
export const resetEntityCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    entityId: Joi.string().hex().length(24).required(),
    entityCommitId: Joi.string().hex().length(24).required(),
  }).required(),
})
