import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { VariableValueSchema } from './schema'

export const validateListVariableValues = (
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
    VariableValueSchema.listVariableValuesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetChangedVariableValues = (
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
    VariableValueSchema.getChangedVariableValuesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetVariableValue = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    VariableValueSchema.getVariableValueSchema,
    {},
    next,
  )
}

export const validateCreateVariableValue = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    VariableValueSchema.createVariableValueSchema,
    {},
    next,
  )
}

export const validateUpdateVariableValue = (
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
    VariableValueSchema.updateVariableValueSchema,
    {},
    next,
  )
}

export const validateDeleteVariableValue = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    VariableValueSchema.deleteVariableValueSchema,
    {},
    next,
  )
}
