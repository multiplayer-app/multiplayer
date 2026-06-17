import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ContinuousDebugSessionAgentSchema } from './schema'

export const validateStartContinuousDebugSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    // params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    ContinuousDebugSessionAgentSchema.startContinuousDebugSessionSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateCancelContinuousDebugSession = (
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
    ContinuousDebugSessionAgentSchema.cancelContinuousDebugSessionSchema,
    {},
    next,
  )
}

export const validateGetContinuousDebugSession = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ContinuousDebugSessionAgentSchema.getContinuousDebugSessionSchema,
    {},
    next,
  )
}

export const validateSaveContinuousDebugSession = (
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
    ContinuousDebugSessionAgentSchema.saveContinuousDebugSessionSchema,
    {},
    next,
  )
}
