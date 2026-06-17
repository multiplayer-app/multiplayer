import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { DebugSessionOtlpTracesSchema } from './schema'

export const validateListDebugSessionOtlpTraces = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    DebugSessionOtlpTracesSchema.listDebugSessionOtlpTracesSchema,
    { updateQuery: true },
    next,
    req,
  )
}
