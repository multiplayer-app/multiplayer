import { Joi } from '@multiplayer/util'

export const resolveTraceSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    traceId: Joi.string().hex().length(32).required(),
  }).required(),
})
