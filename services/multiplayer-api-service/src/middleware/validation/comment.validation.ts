import { JoiValidator } from '@multiplayer/util'
import { NextFunction, Request, Response } from 'express'
import { CommentSchema } from './schema'

export const validateListComments = (
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
    CommentSchema.listCommentsSchema,
    {},
    next,
  )
}

export const validateGetComment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    CommentSchema.getCommentSchema,
    {},
    next,
  )
}

export const validateCreateComment = (
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
    CommentSchema.createCommentSchema,
    {},
    next,
  )
}

export const validateUpdateComment = (
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
    CommentSchema.updateCommentSchema,
    {},
    next,
  )
}

export const validateDeleteComment = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    CommentSchema.deleteCommentSchema,
    {},
    next,
  )
}
