import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AiSchema } from './schema'

export const validateExtractPlatformArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    file: req.file,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    AiSchema.extractPlatformSchema,
    { updateQuery: true },
    next,
    req,
  )
}
