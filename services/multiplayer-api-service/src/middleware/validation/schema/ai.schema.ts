import { Joi } from '@multiplayer/util'

export const extractPlatformSchema = Joi.object({
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    buffer: Joi.object().required(),
    size: Joi.number().required(),
  }).required(),
  query: Joi.object({
    workspace: Joi.string().hex().length(24).required(),
  }),
})
