import { Joi } from '@multiplayer/util'

export const getBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
    repositoryId: Joi.string().required(),
    branchName: Joi.string().required(),
  }),
})


export const listBranchesSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
    repositoryId: Joi.string().required(),
  }),
  query: Joi.object({
    page: Joi.number().min(1),
    perPage: Joi.number().min(10),
  }),
})

export const createBranchSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    integrationId: Joi.string().hex().length(24).required(),
    repositoryId: Joi.string().required(),
  }),
  body: Joi.object({
    name: Joi.string().required(),
    parentBranch: Joi.string().required(),
  }),
})
