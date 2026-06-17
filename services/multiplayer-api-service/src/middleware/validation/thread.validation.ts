import { JoiValidator } from '@multiplayer/util'
import { NextFunction, Request, Response } from 'express'
import { ThreadSchema } from './schema'

export const validateListThreads = (
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
    ThreadSchema.listThreadsSchema,
    {},
    next,
  )
}

export const validateGetThread = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ThreadSchema.getThreadSchema,
    {},
    next,
  )
}

export const validateCreateThread = (
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
    ThreadSchema.createThreadSchema,
    {},
    next,
  )
}

export const validateUpdateThread = (
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
    ThreadSchema.updateThreadSchema,
    {},
    next,
  )
}

export const validateDeleteThread = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ThreadSchema.deleteThreadSchema,
    {},
    next,
  )
}
