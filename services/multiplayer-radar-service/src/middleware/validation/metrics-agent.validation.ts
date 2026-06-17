import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { MetricsAgentSchema } from './schema'

export const validateCreateGaugeMetrics = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    MetricsAgentSchema.createGaugeMetricsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
