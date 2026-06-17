import { Joi } from '@multiplayer/util'

export const sendFeedbackSchema = Joi.object({
  body: Joi.object({
    subject: Joi.string().required(),
    message: Joi.string().required(),
  }).required(),
})
