import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRepositoryTreeSchema } from './schema'

export const validateGetGitRepositoryTreeArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryTreeSchema.getGitRepositoryTreeSchema,
    {},
    next,
  )
}

export const validateGetGitRepositoryTreeByGitIdArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryTreeSchema.getGitRepositoryTreeByGitIdSchema,
    {},
    next,
  )
}
