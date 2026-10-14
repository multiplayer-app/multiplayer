import { Joi } from '@multiplayer/util'
import {
  IntegrationTypeEnum,
  GitContentType,
} from '@multiplayer/types'

export const gitRefSchema = Joi.object({
  repositoryType: Joi.string().valid(...Object.values(IntegrationTypeEnum)).required(),
  repositoryId: Joi.string().required(),
  branch: Joi.string(),
  path: Joi.string(),
  contentType: Joi.string().valid(...Object.values(GitContentType)),
  repositoryName: Joi.string().required(),
  repositoryOwner: Joi.string().required(),
})
