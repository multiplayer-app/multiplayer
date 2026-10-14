import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { EntityShareAdminSchema } from './schema'

export const validateListAllSharedEntitiesInProject = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityShareAdminSchema.listAllSharedEntitiesInProjectSchema,
    { updateQuery: true },
    next,
    req,
  )
}
