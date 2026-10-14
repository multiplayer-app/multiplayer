import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRepositoryBranchSchema } from './schema'

export const validateListGitRepositoryBranchesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryBranchSchema.listGitRepositoryBranchesSchema,
    {},
    next,
  )
}

export const validateGetGitRepositoryBranchesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryBranchSchema.getGitRepositoryBranchSchema,
    {},
    next,
  )
}
export const validateCreateGitRepositoryBranchArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRepositoryBranchSchema.createGitRepositoryBranchSchema,
    {},
    next,
  )
}
