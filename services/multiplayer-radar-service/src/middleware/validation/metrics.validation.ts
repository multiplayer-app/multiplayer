import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { MetricsSchema } from './schema'

export const validateGetMetrics = (
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
    MetricsSchema.getMetricsSchema,
    { updateQuery: true },
    next,
    req,
  )
}