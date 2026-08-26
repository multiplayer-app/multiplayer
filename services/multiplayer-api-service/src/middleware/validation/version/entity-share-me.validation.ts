import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { EntityShareMeSchema } from './schema'

export const validateListEntitiesSharedWithMe = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityShareMeSchema.listEntitiesSharedWithMeSchema,
    { updateQuery: true },
    next,
    req,
  )
}
