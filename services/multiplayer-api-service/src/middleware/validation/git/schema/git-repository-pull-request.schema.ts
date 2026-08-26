import { Joi } from '@multiplayer/util'

export const createGitRepositoryPullRequestSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    repositoryUrl: Joi.string().uri().required(),
    branchName: Joi.string().required(),
    title: Joi.string().required(),
    baseBranch: Joi.string(),
    description: Joi.string(),
  }),
})
