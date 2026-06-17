import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { EnvironmentSchema } from './schema'

export const validateListEnvironment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EnvironmentSchema.listEnvironmentSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetChangedEnvironment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EnvironmentSchema.getChangedEnvironmentSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetEnvironment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EnvironmentSchema.getEnvironmentSchema,
    {},
    next,
  )
}

export const validateCreateEnvironment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EnvironmentSchema.createEnvironmentSchema,
    {},
    next,
  )
}

export const validateUpdateEnvironment = (
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
    EnvironmentSchema.updateEnvironmentSchema,
    {},
    next,
  )
}

export const validateDeleteEnvironment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EnvironmentSchema.deleteEnvironmentSchema,
    {},
    next,
  )
}
