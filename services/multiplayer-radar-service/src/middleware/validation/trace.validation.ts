import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { TraceSchema } from './schema'

export const validateResolveTrace = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TraceSchema.resolveTraceSchema,
    {},
    next,
    req,
  )
}
