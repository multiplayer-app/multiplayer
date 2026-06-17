import { JoiValidator } from '@multiplayer/util'
import { NextFunction, Request, Response } from 'express'
import { GoogleWorkspaceSchema } from './schema'

export const validateAuthGoogleWorkspace = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GoogleWorkspaceSchema.authGoogleWorkspaceSchema,
    {},
    next,
  )
}

export const validateListGoogleWorkspaceUsers = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    GoogleWorkspaceSchema.listGoogleWorkspaceUsersSchema,
    {},
    next,
  )
}
