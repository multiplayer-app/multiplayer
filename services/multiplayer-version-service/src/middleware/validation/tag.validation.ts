import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { TagsSchema } from './schema'

export const validateListTagsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    TagsSchema.listAllTagsSchema,
    {},
    next,
  )
}

