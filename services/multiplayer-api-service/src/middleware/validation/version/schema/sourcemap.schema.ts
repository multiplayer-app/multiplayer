import { Joi } from '@multiplayer/util'

export const uploadSourcemapSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    releaseId: Joi.string().hex().length(24).required(),
  }).required(),
  headers: Joi.object({
    'Content-Disposition': Joi.string().regex(/^attachment; filename="[^"]+"$/).required(),
  }),
})
