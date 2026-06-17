import { Joi } from '@multiplayer/util'
import { CommitContentActionEnum } from '../../../types'

export const createGitRepositoryCommitSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitRepositoryId: Joi.string().required(),
    branchId: Joi.string().required(),
  }),
  body: Joi.object({
    commitMessage: Joi.string().required(),
    contents: Joi.array().items(Joi.object({
      action: Joi.string().valid(...Object.keys(CommitContentActionEnum)).required(),
      filePath: Joi.string().required(),
      content: Joi.string(),
      previousPath: Joi.string(),
    })),
  }),
})

export const createGitCommitByGitIdSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    gitId: Joi.string().required(),
    branchId: Joi.string().required(),
  }),
  body: Joi.object({
    commitMessage: Joi.string().required(),
    contents: Joi.array().items(Joi.object({
      action: Joi.string().valid(...Object.keys(CommitContentActionEnum)).required(),
      filePath: Joi.string().required(),
      content: Joi.string(),
      previousPath: Joi.string(),
    })),
  }),
})
