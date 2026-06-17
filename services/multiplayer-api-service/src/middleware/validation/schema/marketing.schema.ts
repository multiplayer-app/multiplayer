import { Joi } from '@multiplayer/util'

export const addContactSchema = Joi.object({
  body: Joi.object({
    name: Joi.string(),
    email: Joi.string().email().max(100).required(),
    company: Joi.string(),
    phone: Joi.string(),
    message: Joi.string().required(),
  }).required(),
})
