import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { UserSchema } from './schema'

export const validateListUsersArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = { }

  JoiValidator.validateMiddleware(
    args,
    UserSchema.listUserSchema,
    {},
    next,
  )
}

export const validateGetCurrentUserArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = { }

  JoiValidator.validateMiddleware(
    args,
    UserSchema.getCurrentUserSchema,
    {},
    next,
  )
}

export const validateUpdateCurrentUserArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = { body: req.body }

  JoiValidator.validateMiddleware(
    args,
    UserSchema.updateCurrentUserSchema,
    {},
    next,
  )
}

export const validateGetCurrentWorkspaceUserArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    UserSchema.getCurrentWorkspaceUserSchema,
    {},
    next,
  )
}

export const validateUpdateCurrentWorkspaceUserArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    UserSchema.updateCurrentWorkspaceUserSchema,
    {},
    next,
  )
}

export const validateUpdateCurrentWorkspaceUserIconArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    UserSchema.updateCurrentWorkspaceUserIconSchema,
    {},
    next,
  )
}
