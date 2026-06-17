import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { CommitSchema } from './schema'

export const validateListCommits = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    CommitSchema.listCommitSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetCommit = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(args, CommitSchema.getCommitSchema, {}, next)
}

export const validateCreateCommit = (
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
    CommitSchema.createCommitSchema,
    {},
    next,
  )
}

export const validateUpdateCommit = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(args, CommitSchema.updateCommitSchema, {}, next)
}

export const validateDeleteCommit = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(args, CommitSchema.deleteCommitSchema, {}, next)
}
