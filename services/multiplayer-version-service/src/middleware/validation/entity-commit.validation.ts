import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { EntityCommitSchema } from './schema'

export const validateListEntityCommits = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.listEntityCommitsSchema,
    {},
    next,
  )
}

export const validateGetEntityCommit = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.getEntityCommitSchema,
    {},
    next,
  )
}

export const validateCreateEntityCommit = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.createEntityCommitSchema,
    {},
    next,
  )
}
export const validateCopyEntityCommit = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.copyEntityCommitSchema,
    {},
    next,
  )
}

export const validateUpdateEntityCommit = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.updateEntityCommitSchema,
    {},
    next,
  )
}
export const validateUpdateEntityCommitMeta = (
  req: Request,
  es: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.updateEntityCommitMetaSchema,
    {},
    next,
  )
}

export const validateGetLatestEntityCommit = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.getLatestEntityCommitSchema,
    {},
    next,
  )
}

export const validateResetEntityCommit = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    EntityCommitSchema.resetEntityCommitSchema,
    {},
    next,
  )
}
