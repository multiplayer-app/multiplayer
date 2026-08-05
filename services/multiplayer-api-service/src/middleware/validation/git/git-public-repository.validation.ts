import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitPublicRepositorySchema } from './schema'

export const validateListGitPublicRepositoriesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GitPublicRepositorySchema.listGitPublicRepositoriesSchema,
    {},
    next,
  )
}
