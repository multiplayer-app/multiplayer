import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { RoleSchema } from './schema'

export const validateListRoles = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    RoleSchema.listRolesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetRole = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    RoleSchema.getRoleSchema,
    {},
    next,
  )
}
