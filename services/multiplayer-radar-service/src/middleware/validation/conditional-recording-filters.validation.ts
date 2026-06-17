import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ConditionalRecordingFiltersSchema } from './schema'

export const validateListConditionalRecordingFilters = (
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
    ConditionalRecordingFiltersSchema.listConditionalRecordingFiltersSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateCreateConditionalRecordingFilters = (
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
    ConditionalRecordingFiltersSchema.createConditionalRecordingFiltersSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateConditionalRecordingFilters = (
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
    ConditionalRecordingFiltersSchema.updateConditionalRecordingFiltersSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateRemoveConditionalRecordingFilters = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ConditionalRecordingFiltersSchema.removeConditionalRecordingFiltersSchema,
    { updateQuery: true },
    next,
    req,
  )
}