import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { AlertRulesSchema } from './schema'

export const validateListAlertRules = (
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
    AlertRulesSchema.listAlertRulesSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetAlertRule = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AlertRulesSchema.getAlertRuleSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateCreateAlertRule = (
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
    AlertRulesSchema.createAlertRuleSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateUpdateAlertRule = (
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
    AlertRulesSchema.updateAlertRuleSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateRemoveAlertRule = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    AlertRulesSchema.removeAlertRuleSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateRunAlertRuleActionTest = (
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
    AlertRulesSchema.runAlertRuleActionTestSchema,
    { updateQuery: true },
    next,
    req,
  )
}