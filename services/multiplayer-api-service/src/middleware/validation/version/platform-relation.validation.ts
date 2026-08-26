import { NextFunction, Request, Response } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { PlatformRelationSchema } from './schema'

export const validateListPlatformRelations = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    PlatformRelationSchema.listPlatformRelationsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateCreatePlatformRelation = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    body: req.body,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    PlatformRelationSchema.createPlatformRelationSchema,
    {},
    next,
  )
}

export const validateDeletePlatformRelations = (
  req: Request, res: Response, next: NextFunction,
) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    PlatformRelationSchema.deletePlatformRelationsSchema,
    {},
    next,
  )
}
