import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { SourcemapSchema } from './schema'

export const validateUploadSourcemapArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    SourcemapSchema.uploadSourcemapSchema,
    {},
    next,
  )
}

