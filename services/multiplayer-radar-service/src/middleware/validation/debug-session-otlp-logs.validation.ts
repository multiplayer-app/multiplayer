import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { DebugSessionOtlpLogsSchema } from './schema'

export const validateListDebugSessionOtlpLogs = (
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
    DebugSessionOtlpLogsSchema.listDebugSessionOtlpLogschema,
    { updateQuery: true },
    next,
    req,
  )
}
