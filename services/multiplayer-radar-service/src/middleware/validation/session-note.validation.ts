import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { SessionNoteSchema } from './schema'

export const validateGetSessionNote = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    SessionNoteSchema.getSessionNoteSchema,
    { updateQuery: true },
    next,
    req,
  )
}
export const validateGetSessionNoteUpdate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    SessionNoteSchema.getSessionNoteUpdateSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateCreateSessionNote = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    SessionNoteSchema.createSessionNoteSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateDeleteSessionNote = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    SessionNoteSchema.deleteSessionNoteSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetSessionNoteFile = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    SessionNoteSchema.getSessionNoteFileSchema,
    { updateQuery: true },
    next,
    req,
  )
}