import { Joi } from '@multiplayer/util'
import {
  IntegrationTypeEnum,
} from '@multiplayer/types'

export const listGitPublicRepositoriesSchema = Joi.object({
  query: Joi.object({
    gitProviderType: Joi.string()
      .allow(...Object.keys(IntegrationTypeEnum))
      .required(),
    repositoryName: Joi.string(),
    page: Joi.number().min(1),
    perPage: Joi.number().min(10),
  }),
})
