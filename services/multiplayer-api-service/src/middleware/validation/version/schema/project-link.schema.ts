import { Joi } from '@multiplayer/util'
import {
  ProjectLinkObjectType,
  IntegrationTypeEnum,
  EntityType,
} from '@multiplayer/types'
import { gitRefSchema } from './shared/git-ref.schema'

export const listProjectLinksSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    gitRefRepositoryId: Joi.string(),
    gitRefType: Joi.string().valid(...Object.values(IntegrationTypeEnum)),
    gitRefBranch: Joi.string(),
    gitRefPath: Joi.string(),
    archived: Joi.boolean(),
    targetObjectType: Joi.alternatives().try(
      Joi.string().valid(...Object.values(ProjectLinkObjectType)),
      Joi.array().items(
        Joi.string().valid(...Object.values(ProjectLinkObjectType)),
      ),
    ),
    sourceObjectType: Joi.alternatives().try(
      Joi.string().valid(...Object.values(ProjectLinkObjectType)),
      Joi.array().items(
        Joi.string().valid(...Object.values(ProjectLinkObjectType)),
      ),
    ),
    targetEntityType: Joi.alternatives().try(
      Joi.string().valid(...Object.values(EntityType)),
      Joi.array().items(
        Joi.string().valid(...Object.values(EntityType)),
      ),
    ),
    sourceEntityType: Joi.alternatives().try(
      Joi.string().valid(...Object.values(EntityType)),
      Joi.array().items(
        Joi.string().valid(...Object.values(EntityType)),
      ),
    ),
    sourceObjectEntityTypesToExclude: Joi.array().items(
      Joi.string().valid(...Object.values(EntityType)),
    ),
    targetObjectId: Joi.string().hex().length(24),
    sourceObjectId: Joi.string().hex().length(24),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})
export const getChangedProjectLinks = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
  }).required(),
})

export const getProjectLinkSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    projectLinkId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createProjectLinkSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    sourceObject: Joi.string().hex().length(24)
      .when('sourceObjectType', {
        is: ProjectLinkObjectType.Entity,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    sourceObjectType: Joi.string().valid(...Object.values(ProjectLinkObjectType)).required(),
    sourceGitRef: gitRefSchema
      .when('sourceObjectType', {
        is: [
          ProjectLinkObjectType.GitFile,
          ProjectLinkObjectType.GitRepository,
        ],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    sourceUri: Joi.string().uri()
      .when('sourceObjectType', {
        is: ProjectLinkObjectType.External,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    targetObject: Joi.string().hex().length(24).required(),
    targetObjectType: Joi.string().valid(...Object.values(ProjectLinkObjectType)).required(),
  }).required(),
})

export const bulkCreateProjectLinkSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.array().items(Joi.object({
    archived: Joi.boolean(),
    sourceObject: Joi.string().hex().length(24)
      .when('sourceObjectType', {
        is: ProjectLinkObjectType.Entity,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    sourceObjectType: Joi.string().valid(...Object.values(ProjectLinkObjectType)).required(),
    sourceGitRef: gitRefSchema
      .when('sourceObjectType', {
        is: [
          ProjectLinkObjectType.GitFile,
          ProjectLinkObjectType.GitRepository,
        ],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    sourceUri: Joi.string().uri()
      .when('sourceObjectType', {
        is: ProjectLinkObjectType.External,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    targetObject: Joi.string().hex().length(24).required(),
    targetObjectType: Joi.string().valid(...Object.values(ProjectLinkObjectType)).required(),
  }).max(100).required()),
})

export const updateProjectLinkSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    projectLinkId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    archived: Joi.boolean(),
    sourceObjectType: Joi.string().valid(...Object.values(ProjectLinkObjectType)),
    sourceObject: Joi.string().hex().length(24)
      .when('sourceObjectType', {
        is: ProjectLinkObjectType.Entity,
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    sourceGitRef: gitRefSchema
      .when('sourceObjectType', {
        is: [
          ProjectLinkObjectType.GitFile,
          ProjectLinkObjectType.GitRepository,
        ],
        then: Joi.required(),
        otherwise: Joi.forbidden(),
      }),
    targetObject: Joi.string().hex().length(24),
    targetObjectType: Joi.string().valid(...Object.values(ProjectLinkObjectType)),
  })
    .required(),
})

export const deleteProjectLinkSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    projectLinkId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const deleteProjectLinkByParamsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    sourceObject: Joi.string().hex().length(24).required(),
    targetObject: Joi.string().hex().length(24).required(),
  }).required(),
})
