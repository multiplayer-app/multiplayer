import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRepositoryCommitSchema } from './schema'

export const validateCreateGitRepositoryCommitArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryCommitSchema.createGitRepositoryCommitSchema,
    {},
    next,
  )
}

export const validateCreateGitRepositoryCommitByGitIdArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryCommitSchema.createGitCommitByGitIdSchema,
    {},
    next,
  )
}
