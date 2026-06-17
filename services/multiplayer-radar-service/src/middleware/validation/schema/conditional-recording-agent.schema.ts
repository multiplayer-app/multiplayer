import { Joi } from '@multiplayer/util'
import { endUserAttributesSchema } from './shared/end-user.schema'

export const checkStartConditionalRecordingSchema = Joi.object({
  params: Joi.object({}).required(),
  body: Joi.object({
    sessionAttributes: Joi.object().keys({}).unknown(true),
    resourceAttributes: Joi.object().keys({}).unknown(true),
    userAttributes: Joi.alternatives(
      endUserAttributesSchema,
      Joi.allow(null),
    ),
  }).required(),
})
