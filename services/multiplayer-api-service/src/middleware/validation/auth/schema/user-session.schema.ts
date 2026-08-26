import { Joi } from '@multiplayer/util'

export const getGetUserSessionSchema = Joi.object({})

export const updateUserSessionSchema = Joi.object({
  body: Joi.object({
    current: Joi.string().hex().length(24).required(),
  }).required(),
})
