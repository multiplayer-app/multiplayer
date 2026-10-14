import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { EntityUpdateSchema } from './schema'

export const downloadEntityUpdate = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityUpdateSchema.downloadEntityUpdate,
    { updateQuery: true },
    next,
    req,
  )
}
export const uploadEntityUpdate = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityUpdateSchema.uploadEntityUpdate,
    { updateQuery: true },
    next,
    req,
  )
}
