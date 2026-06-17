import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ApiKeySchema } from './schema'

export const validateGenerateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ApiKeySchema.generateTempApiKeySchema,
    {},
    next,
  )
}
