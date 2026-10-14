import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRepositoryTagSchema } from './schema'

export const validateListGitRepositoryTagsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryTagSchema.listGitRepositoryTagsSchema,
    {},
    next,
  )
}
