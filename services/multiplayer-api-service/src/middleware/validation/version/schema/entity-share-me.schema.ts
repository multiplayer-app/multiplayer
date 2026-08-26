import { Joi } from '@multiplayer/util'
import { SortOrder } from '@multiplayer/models'

export const listEntitiesSharedWithMeSchema = Joi.object({
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(1000),
    skip: Joi.number().integer().min(0),
    sortDirection: Joi.number().valid(...Object.values(SortOrder)),
    sortKey: Joi.string().max(100),
  }).required(),
})
