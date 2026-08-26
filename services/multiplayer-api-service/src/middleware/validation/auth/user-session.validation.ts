import { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { UserSessionSchema } from './schema'

export const validateGetUserSessionArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {}

  JoiValidator.validateMiddleware(args, UserSessionSchema.getGetUserSessionSchema, {}, next)
}

export const validateUpdateUserSessionArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(args, UserSessionSchema.updateUserSessionSchema, {}, next)
}
