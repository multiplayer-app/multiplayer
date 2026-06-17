import { Joi } from '@multiplayer/util'

export const sessionRecordingOptionsSchema = Joi.object({
  frontend: Joi.object({
    screens: Joi.boolean(),
    traces: Joi.boolean(),
    logs: Joi.boolean(),
    logLevel: Joi.string().valid('debug', 'info', 'warn', 'error'),
    content: Joi.boolean(),
  }),
  backend: Joi.object({
    traces: Joi.boolean(),
    logs: Joi.boolean(),
    logLevel: Joi.string().valid('debug', 'info', 'warn', 'error'),
    content: Joi.boolean(),
  }),
})
