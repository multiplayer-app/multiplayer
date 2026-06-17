import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AgentChatAttachmentsSchema } from './schema'

export const validateGetAttachmentUploadPresignedUrl = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatAttachmentsSchema.getAttachmentUploadPresignedUrlSchema,
    {},
    next,
    req,
  )
}
