import { Joi } from '@multiplayer/util'

export const generateCodeSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    message: Joi.alternatives().conditional('adjustmentMessage', {
      is: Joi.exist(),
      then: Joi.string().optional(),
      otherwise: Joi.string().required(),
    }),
    system: Joi.string(),
    model: Joi.string(),
    block: Joi.object({
      type: Joi.string(),
      attrs: Joi.object(),
      content: Joi.array().items(Joi.object()),
    }).when('adjustmentMessage', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    adjustmentMessage: Joi.string(),
  }).required(),
  query: Joi.object({
    entityId: Joi.string().hex().length(24),
  }),
})

export const chatSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
    projectBranchId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    messages: Joi.array().items(Joi.string()).min(1).required(),
    system: Joi.string(),
    model: Joi.string(),
  }).required(),
})