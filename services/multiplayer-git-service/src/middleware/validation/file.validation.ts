import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { FileSchema } from './schema'

export const validateGetFileContentsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(args, FileSchema.getFileContentsSchema, {}, next)
}
