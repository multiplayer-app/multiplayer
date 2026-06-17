import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { GlobalIssueSettingsSchema } from './schema'

export const validateGetGlobalIssuesSettings = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    GlobalIssueSettingsSchema.getGlobalIssuesSettingsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateGlobalIssuesSettings = (
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
    GlobalIssueSettingsSchema.updateGlobalIssuesSettingsSchema,
    { updateQuery: true },
    next,
    req,
  )
}
