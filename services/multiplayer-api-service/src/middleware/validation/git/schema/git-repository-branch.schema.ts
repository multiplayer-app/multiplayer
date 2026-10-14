import { Joi } from '@multiplayer/util'

export const listGitRepositoryBranchesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().hex().length(24).required(),
  }),
  query: Joi.object({
    page: Joi.number().min(1),
    perPage: Joi.number().min(10),
  }),
})

export const createGitRepositoryBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().required(),
    parentBranch: Joi.string().required(),
  }),
})

export const getGitRepositoryBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().hex().length(24).required(),
    branchName: Joi.string().required(),
  }),
})
