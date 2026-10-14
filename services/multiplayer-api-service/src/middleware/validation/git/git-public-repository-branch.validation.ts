import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitPublicRepositoryBranchSchema } from './schema'

export const validateGetGitPublicRepositoryBranchArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitPublicRepositoryBranchSchema.getGitPublicRepositoryBranchSchema,
    {},
    next,
  )
}

export const validateListGitPublicRepositoryBranchesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GitPublicRepositoryBranchSchema.listGitPublicRepositoryBranchesSchema,
    {},
    next,
  )
}
