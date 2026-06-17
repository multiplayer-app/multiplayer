import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { CommitSchema } from './schema'

export const validateCreateCommitArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(args, CommitSchema.createCommitSchema, {}, next)
}
