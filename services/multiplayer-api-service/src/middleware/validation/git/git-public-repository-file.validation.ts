import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitPublicRepositoryFileSchema } from './schema'

export const validateGetGitPublicRepositoryFileContentsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitPublicRepositoryFileSchema.getGitPublicRepositoryFileContentsSchema,
    {},
    next,
  )
}
