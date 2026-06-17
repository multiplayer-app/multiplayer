import { Joi } from '@multiplayer/util'
import {
  IntegrationTypeEnum,
} from '@multiplayer/types'

export const getGitPublicRepositoryBranchSchema = Joi.object({
  params: Joi.object({
    gitPublicRepositoryId: Joi.string().required(),
    branchName: Joi.string().required(),
  }),
})

export const listGitPublicRepositoryBranchesSchema = Joi.object({
  params: Joi.object({
    gitPublicRepositoryId: Joi.string().required(),
  }),
  query: Joi.object({
    gitProviderType: Joi.string()
      .allow(...Object.keys(IntegrationTypeEnum))
      .required(),
    page: Joi.number().min(1),
    perPage: Joi.number().min(10),
  }),
})
