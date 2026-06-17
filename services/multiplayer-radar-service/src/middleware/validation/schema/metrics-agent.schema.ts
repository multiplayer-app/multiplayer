import { Joi } from '@multiplayer/util'
import { MetricName } from '@multiplayer/types'
import { endUserAttributesSchema } from './shared/end-user.schema'

export const createGaugeMetricsSchema = Joi.object({
  params: Joi.object({}).required(),
  body: Joi.array().items(
    Joi.object({
      userAttributes: endUserAttributesSchema.required(),
      MetricName: Joi.string().valid(...Object.values(MetricName)).required(),
      Attributes: Joi.object().pattern(Joi.string(), Joi.string()),
      Value: Joi.number().required(),
    }),
  ).min(1).required(),
})
