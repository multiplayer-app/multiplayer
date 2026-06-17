import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { DebugSessionRrwebEventsSchema } from './schema'

export const validateListDebugSessionRrwebEvents = (
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
    DebugSessionRrwebEventsSchema.listDebugSessionRrwebEventsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
