import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { DebugSessionAgentSchema } from './schema'

export const validateStartDebugSessionFromErrorSpan = (
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
    DebugSessionAgentSchema.startDebugSessionFromErrorSpanSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateStartDebugSession = (
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
    DebugSessionAgentSchema.startDebugSessionSchema,
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
    DebugSessionAgentSchema.updateDebugSessionSchema,
    {},
    next,
  )
}

export const validateStopDebugSession = (
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
    DebugSessionAgentSchema.stopDebugSessionSchema,
    {},
    next,
  )
}

export const validateGetDebugSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    DebugSessionAgentSchema.getDebugSessionSchema,
    {},
    next,
  )
}

export const validateCancelDebugSession = (
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
    DebugSessionAgentSchema.cancelDebugSessionSchema,
    {},
    next,
  )
}

export const validateCreateDebugSessionRrwebEvents = (
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
    DebugSessionAgentSchema.createDebugSessionRrwebEventsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateCreateDebugSessionRrwebS3File = (
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
    DebugSessionAgentSchema.createDebugSessionRrwebS3FileSchema,
    { updateQuery: true },
    next,
    req,
  )
}
