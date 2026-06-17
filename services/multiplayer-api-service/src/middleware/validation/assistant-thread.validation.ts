import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AssistantThreadSchema } from './schema'


export const validateGenerateCode = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    AssistantThreadSchema.generateCodeSchema,
    { updateQuery: true },
    next,
    req,
  )
}
export const validateChat = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    AssistantThreadSchema.chatSchema,
    { updateQuery: true },
    next,
    req,
  )
}