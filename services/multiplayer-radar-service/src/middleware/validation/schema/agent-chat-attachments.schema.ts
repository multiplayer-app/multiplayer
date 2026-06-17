import { Joi } from '@multiplayer/util'

export const getAttachmentUploadPresignedUrlSchema = Joi.object({
  params: Joi.object({
    workspaceId: Joi.string().hex().length(24).required(),
    projectId: Joi.string().hex().length(24).required(),
  }).required(),
  body: Joi.object({
    filename: Joi.string().min(1).max(500).required(),
    mimeType: Joi.string().min(1).max(200).required(),
    size: Joi.number().integer().min(0).required(),
    chatId: Joi.string().required(),
    userId: Joi.string().optional(),
  }).required(),
})
