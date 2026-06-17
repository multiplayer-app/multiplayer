import { Joi } from '@multiplayer/util'
import { EndUserType } from '@multiplayer/types'

export const endUserAttributesSchema = Joi.object().keys({
  type: Joi.string().valid(...Object.values(EndUserType)).required(),
  id: Joi.string(),
  name: Joi.string(),
  groupId: Joi.string(),
  groupName: Joi.string(),
  environment: Joi.string(),

  userEmail: Joi.string(),
  userId: Joi.string(),
  userName: Joi.string(),
  accountId: Joi.string(),
  accountName: Joi.string(),
  orgId: Joi.string(),
  orgName: Joi.string(),
})
