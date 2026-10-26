import { Joi } from '@multiplayer/util'
import { NotificationType } from '@multiplayer/types'

export const createNotificationSchema = Joi.object({
  body: Joi.object({
    notificationType: Joi.string().valid(...Object.values(NotificationType)),
    integration: Joi.string(),
    slackChannelOptions: Joi.object().unknown(true),
    webhookOptions: Joi.object({
      url: Joi.string().uri({ scheme: ['https', 'http'] }).required(),
      secret: Joi.string(),
    }).when('notificationType', { is: NotificationType.WEBHOOK, then: Joi.required(), otherwise: Joi.forbidden() }),
    teamsOptions: Joi.object({
      webhookUrl: Joi.string().uri({ scheme: ['https', 'http'] }).required(),
    }).when('notificationType', { is: NotificationType.TEAMS, then: Joi.required(), otherwise: Joi.forbidden() }),
    slackWebhookOptions: Joi.object({
      webhookUrl: Joi.string().uri({ scheme: ['https', 'http'] }).required(),
    }).when('notificationType', { is: NotificationType.SLACK_WEBHOOK, then: Joi.required(), otherwise: Joi.forbidden() }),
    template: Joi.string().required(),
    // Only emails have a recipient address; the other channels carry their own options
    email: Joi.string().when('notificationType', {
      is: Joi.exist().not(NotificationType.EMAIL),
      then: Joi.optional().allow(''),
      otherwise: Joi.required(),
    }),
    data: Joi.any(),
    sendAt: Joi.alternatives(Joi.string(), Joi.date()),
  }).required(),
})
