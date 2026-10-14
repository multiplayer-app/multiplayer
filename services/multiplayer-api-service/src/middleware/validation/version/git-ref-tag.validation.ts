import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GitRefTagSchema } from './schema'

export const validateListGitRefTags = (
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
    GitRefTagSchema.listGitRefTagsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
export const validateGetChangedGitRefTags = (
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
    GitRefTagSchema.getChangedGitRefTagsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetGitRefTag = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRefTagSchema.getGitRefTagSchema,
    {},
    next,
  )
}

export const validateCreateGitRefTag = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRefTagSchema.createGitRefTagSchema,
    {},
    next,
  )
}

export const validateUpdateGitRefTag = (
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
    GitRefTagSchema.updateGitRefTagSchema,
    {},
    next,
  )
}

export const validateDeleteGitRefTag = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GitRefTagSchema.deleteGitRefTagSchema,
    {},
    next,
  )
}
