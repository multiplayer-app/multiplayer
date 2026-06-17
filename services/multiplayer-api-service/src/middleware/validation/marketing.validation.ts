import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { MarketingSchema } from './schema'

export const validateAddContact = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    MarketingSchema.addContactSchema,
    {},
    next,
  )
}
