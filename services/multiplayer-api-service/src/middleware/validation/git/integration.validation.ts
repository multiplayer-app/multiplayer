import type { Request, Response, NextFunction } from 'express'
import { IntegrationTypeEnum } from '@multiplayer/types'
import { JoiValidator } from '@multiplayer/util'
import { InvalidArgumentError } from 'restify-errors'
import { IntegrationSchema } from './schema'

export const validateCreateIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    body: req.body,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.createIntegrationSchema,
    {},
    next,
  )
}

export const validateListIntegrationsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.listIntegrationsSchema,
    {},
    next,
  )
}

export const validateGetIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.getIntegrationSchema,
    {},
    next,
  )
}

export const validateResyncIntegrationArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.resyncIntegrationSchema,
    {},
    next,
  )
}

export const validateUpdateIntegrationArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.updateIntegrationSchema,
    {},
    next,
  )
}

export const validateDeleteIntegrationArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.deleteIntegrationSchema,
    {},
    next,
  )
}

export const validateGetGithubAppIntegrationInstallUrlArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.getGithubAppIntegrationInstallUrlSchema,
    {},
    next,
  )
}

export const validateGithubAppIntegrationPostInstallHookArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.githubAppIntegrationPostInstallHook,
    {},
    next,
  )
}

export const validateIntegrationType = (integrationTypes: IntegrationTypeEnum[]) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!integrationTypes.includes(req.integration.type)) {
    return next(new InvalidArgumentError(`Integration type should be one of ${integrationTypes.toString()}`))
  }

  next()
}

export const validateUpdateLinearIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.updateLinearIntegrationSchema,
    {},
    next,
  )
}

export const validateUpdateAtlassianIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.updateAtlassianIntegrationSchema,
    {},
    next,
  )
}

export const validateRotateRadarIntegrationKeyArgs = (
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
    IntegrationSchema.rotateOtelIntegrationKeySchema,
    {},
    next,
  )
}

export const validateGetOtelIntegrationStatusArgs = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.getOtelIntegrationStatusSchema,
    {},
    next,
  )
}

export const validateGetAtlassianIntegrationOrgsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.getAtlassianIntegrationOrgsSchema,
    {},
    next,
  )
}

export const validateGetAtlassianIntegrationStatusesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.getAtlassianIntegrationStatusesSchema,
    {},
    next,
  )
}

export const validateGetLinearIntegrationStatusesArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationSchema.getLinearIntegrationStatusesSchema,
    {},
    next,
  )
}
