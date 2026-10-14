import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ProjectBranchSchema } from './schema'

export const validateGetBranchArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.getBranchSchema,
    {},
    next,
  )
}

export const validateListBranchesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectBranchSchema.listBranchesSchema,
    {},
    next,
  )
}

export const validateCreateBranchArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(args, ProjectBranchSchema.createBranchSchema, {}, next)
}
