import { Joi } from '@multiplayer/util'

export const applyTokenSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
  }).required(),
})

export const getTokenSchema = Joi.object({
  params: Joi.object({
    token: Joi.string().required(),
  }).required(),
})
