import { Joi } from '@multiplayer/util'

export const getReleaseSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    releaseId: Joi.string().hex().length(24).required(),
  }),
})

export const listReleasesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    skip: Joi.number().integer().min(0).max(1000),
    limit: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    entity: Joi.string().hex().length(24),
    version: Joi.string(),
  })
    .with('limit', 'skip')
    .with('skip', 'limit')
    .with('sortDirection', 'sortKey')
    .with('sortKey', 'sortDirection')
    .required(),
})


export const createReleaseSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    entity: Joi.string().hex().length(24).required(),
    version: Joi.string().required(),
    commitHash: Joi.string().hex().max(40),
    repositoryUrl: Joi.string().uri(),
    releaseNotes: Joi.string().allow('', null),
  }),
})

export const updateReleaseSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    releaseId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    version: Joi.string(),
    releaseNotes: Joi.string().allow('', null),
  }),
})


export const deleteReleaseSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    releaseId: Joi.string().hex().length(24).required(),
  }),
})
