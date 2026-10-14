import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitPublicRepositoryTreeSchema } from './schema'

export const validateGetGitPublicRepositoryTreeArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GitPublicRepositoryTreeSchema.getGitPublicRepositoryTreeSchema,
    {},
    next,
  )
}
