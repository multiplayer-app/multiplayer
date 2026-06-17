import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { StatsSchema } from './schema'

export const validateGetStats = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    StatsSchema.getStatsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
