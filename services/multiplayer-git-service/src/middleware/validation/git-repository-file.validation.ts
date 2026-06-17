import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRepositoryFileSchema } from './schema'

export const validateGetGitRepositoryFileContentsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryFileSchema.getGitRepositoryFileContentsSchema,
    {},
    next,
  )
}

export const validateGetGitRepositoryFileContentsByGitIdArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryFileSchema.getGitRepositoryFileContentsByGitIdSchema,
    {},
    next,
  )
}
