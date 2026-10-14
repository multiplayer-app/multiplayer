import { Joi } from '@multiplayer/util'

export const createNotificationSchema = Joi.object({
  body: Joi.object({
    notificationType: Joi.string().valid('EMAIL', 'SLACK'),
    integration: Joi.string(),
    slackChannelOptions: Joi.object().unknown(true),
    template: Joi.string().required(),
    email: Joi.string().allow('').required(),
    data: Joi.any(),
    sendAt: Joi.alternatives(Joi.string(), Joi.date()),
  }).required(),
})
