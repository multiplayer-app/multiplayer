import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { TagSchema } from './schema'

export const validateListTags = (
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
    TagSchema.listTagsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetTag = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TagSchema.getTagSchema,
    {},
    next,
  )
}

export const validateCreateTag = (
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
    TagSchema.createTagSchema,
    {},
    next,
  )
}

export const validateUpdateTag = (
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
    TagSchema.updateTagSchema,
    {},
    next,
  )
}

export const validateDeleteTag = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TagSchema.deleteTagSchema,
    {},
    next,
  )
}
