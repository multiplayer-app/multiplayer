import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ReleaseSchema } from './schema'

export const validateCreateReleaseArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    ReleaseSchema.createReleaseSchema,
    {},
    next,
  )
}


export const validateGetReleaseArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ReleaseSchema.getReleaseSchema,
    {},
    next,
  )
}


export const validateListReleasesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ReleaseSchema.listReleasesSchema,
    {},
    next,
  )
}

export const validateUpdateReleaseArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    ReleaseSchema.updateReleaseSchema,
    {},
    next,
  )
}

export const validateDeleteReleaseArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ReleaseSchema.deleteReleaseSchema,
    {},
    next,
  )
}
