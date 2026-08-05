import { Joi } from '@multiplayer/util'
import {
  ProjectBranchStatus,
  ProjectBranchType,
  EntityType,
  EntityCommitChangeType,
} from '@multiplayer/types'

const gitBranchNameRegexp = /^[a-zA-Z0-9-_./]+$/
export const listProjectBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    archived: Joi.boolean(),
    default: Joi.boolean(),
    name: Joi.string(),
    status: Joi.alternatives().try(
      Joi.string().valid(...Object.values(ProjectBranchStatus)),
      Joi.array().items(Joi.string().valid(...Object.values(ProjectBranchStatus))),
    ),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getProjectBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getDefaultProjectProjectBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const createProjectProjectBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string().required(),
    parentProjectBranch: Joi.string().hex().length(24),
    status: Joi.string().valid(...Object.values(ProjectBranchStatus)),
    type: Joi.string().valid(...Object.values(ProjectBranchType)).required(),
    archived: Joi.boolean(),
    default: Joi.boolean(),
  }).required(),
})

export const updateProjectBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    name: Joi.string(),
    archived: Joi.boolean(),
    default: Joi.boolean(),
    status: Joi.string().valid(...Object.values(ProjectBranchStatus)),
    type: Joi.string().valid(...Object.values(ProjectBranchType)),
    defaultGitBranchName: Joi.string().regex(gitBranchNameRegexp).min(1).max(100),
  }).required(),
})

export const deleteProjectBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const mergeBranchesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    projectBranchFrom: Joi.string().hex().length(24).required(),
    projectBranchTo: Joi.string().hex().length(24).required(),
    entityCommits: Joi.array().items(Joi.string().hex().length(24)).unique(),
    excludedEntities: Joi.array().items(Joi.string().hex().length(24)).unique(),
    workspaceUsers: Joi.array().items(Joi.string().hex().length(24)).unique().min(1).required(),
  }).required(),
})

export const getBranchConflictsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    projectBranchFrom: Joi.string().hex().length(24).required(),
    projectBranchTo: Joi.string().hex().length(24).required(),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
  }).required(),
})

export const getBranchChangesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    entityType: Joi.string().valid(...Object.values(EntityType)),
    changeType: Joi.string().valid(...Object.values(EntityCommitChangeType)),
    commit: Joi.string().hex().length(24),
  }),
})

export const getBranchChangesStatsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
})

export const getProjectBranchStateSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  query: Joi.object({
    archived: Joi.boolean(),
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    commit: Joi.string().hex().length(24),
    entityType: Joi.string().valid(...Object.values(EntityType)),
    changeType: Joi.string().valid(...Object.values(EntityCommitChangeType)),
    entityId: Joi.alternatives().try(
      Joi.string().hex().length(24),
      Joi.array().items(Joi.string().hex().length(24)),
    ),
    key: Joi.string(),
    sortDirection: Joi.number().valid(1, -1),
    sortKey: Joi.string().max(100),
    hasUncommittedSource: Joi.boolean(),
    tags: Joi.array().items(
      Joi.string().max(400).regex(/^(?<KEY>[^:]*):(?<VALUE>.+)$/),
    ).max(32),
    default: Joi.boolean(),
  }).required(),
})
export const commitBranchArgsSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
})
export const updateDefaultGitRepositoryBranchName = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    branchName: Joi.string().regex(gitBranchNameRegexp).min(1).max(100),
  }).required(),
})
