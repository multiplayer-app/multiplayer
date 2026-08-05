import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { TreeSchema } from './schema'

export const validateGetRepositoryTreeArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(args, TreeSchema.getRepositoryTreeSchema, {}, next)
}
