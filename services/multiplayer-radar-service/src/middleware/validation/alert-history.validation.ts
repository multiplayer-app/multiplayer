import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AlertHistorySchema } from './schema'

export const validateListAlertHistory = (
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
    AlertHistorySchema.listAlertHistorySchema,
    { updateQuery: true },
    next,
    req,
  )
}
