import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AgentChatSchema } from './schema'

export const validateCreateChat = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.createChatSchema,
    {},
    next,
    req,
  )
}

export const validateListChats = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, query: req.query },
    AgentChatSchema.listChatsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetChat = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params },
    AgentChatSchema.getChatSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetChatMessages = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, query: req.query },
    AgentChatSchema.getChatMessagesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateStreamMessage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.streamMessageSchema,
    {},
    next,
    req,
  )
}

export const validateGenerateTitle = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.generateTitleSchema,
    {},
    next,
    req,
  )
}

export const validateBulkDeleteChats = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.bulkRemoveChatsSchema,
    {},
    next,
    req,
  )
}

export const validatePatchToolCall = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.patchToolCallSchema,
    {},
    next,
    req,
  )
}

export const validateUpdateChat = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.updateChatSchema,
    {},
    next,
    req,
  )
}

export const validateBulkUpdateChats = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.bulkUpdateChatsSchema,
    {},
    next,
    req,
  )
}

export const validateBulkRemoveAgentChats = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.bulkRemoveChatsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetPresignedUploadAttachmentUrl = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  JoiValidator.validateMiddleware(
    { params: req.params, body: req.body },
    AgentChatSchema.getPresignedUploadAttachmentUrlSchema,
    {},
    next,
    req,
  )
}
