import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRepositoryPullRequestSchema } from './schema'

export const validateCreateGitRepositoryPullRequestArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryPullRequestSchema.createGitRepositoryPullRequestSchema,
    {},
    next,
  )
}
