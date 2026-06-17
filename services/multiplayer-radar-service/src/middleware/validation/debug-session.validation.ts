import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { DebugSessionSchema } from './schema'

export const validateListDebugSessions = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    DebugSessionSchema.listDebugSessionsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetDebugSession = (
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
    DebugSessionSchema.getDebugSessionSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateRemoveDebugSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    DebugSessionSchema.removeDebugSessionSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateDebugSession = (
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
    DebugSessionSchema.updateDebugSessionSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateAddStarToDebugSession = (
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
    DebugSessionSchema.addStarToDebugSessionSchema,
    {},
    next,
  )
}

export const validateRemoveStarFromDebugSession = (
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
    DebugSessionSchema.removeStarFromDebugSessionSchema,
    {},
    next,
  )
}

export const validateAddViewToDebugSession = (
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
    DebugSessionSchema.addViewToDebugSessionSchema,
    {},
    next,
  )
}

export const validateRemoveViewFromDebugSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    DebugSessionSchema.removeViewFromDebugSessionSchema,
    {},
    next,
  )
}

export const validateUpdateDebugSessionView = (
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
    DebugSessionSchema.updateDebugSessionViewSchema,
    {},
    next,
  )
}

export const validateBulkDeleteDebugSessions = (
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
    DebugSessionSchema.bulkDeleteDebugSessionsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
