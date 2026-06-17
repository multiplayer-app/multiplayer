import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AccountSchema } from './schema'

export const validateGetAccount = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AccountSchema.getAccountSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetAccountBillingCustomerPortal = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AccountSchema.getAccountBillingCustomerPortalSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetAccountRoles = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AccountSchema.getAccountRolesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetAccountRole = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AccountSchema.getAccountRoleSchema,
    {},
    next,
  )
}
