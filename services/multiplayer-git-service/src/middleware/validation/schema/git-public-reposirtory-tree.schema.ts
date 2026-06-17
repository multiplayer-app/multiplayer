import { Joi } from '@multiplayer/util'
import {
  IntegrationTypeEnum,
} from '@multiplayer/types'

export const getGitPublicRepositoryTreeSchema = Joi.object({
  params: Joi.object({
    gitPublicRepositoryId: Joi.string().required(),
    path: Joi.string().required(),
  }),
  query: Joi.object({
    gitProviderType: Joi.string()
      .allow(...Object.keys(IntegrationTypeEnum))
      .required(),
    ref: Joi.string().required(),
    page: Joi.string(),
    perPage: Joi.number().min(10),
  }),
})
