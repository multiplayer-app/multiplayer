import { Joi } from '@multiplayer/util'

export const listStripePlansSchema = Joi.object({
  params: Joi.object({}).required(),
})
