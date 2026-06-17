import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { PlatformsSchema } from './schema'

export const validateListPlatforms = (
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
    PlatformsSchema.listPlatformsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
