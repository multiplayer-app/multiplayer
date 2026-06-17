import { Joi } from '@multiplayer/util'

export const accessSchema = Joi.object({
  guest: Joi.object({
    enabled: Joi.boolean(),
    role: Joi.string().hex().length(24),
  }),
})
