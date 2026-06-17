import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { FeedbackSchema } from './schema'

export const validateSendFeedback = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    FeedbackSchema.sendFeedbackSchema,
    {},
    next,
  )
}
