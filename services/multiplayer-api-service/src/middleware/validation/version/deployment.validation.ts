import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { DeploymentSchema } from './schema'

export const validateCreateDeploymentArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
    body: req.body,
  }

  JoiValidator.validateMiddleware(
    args,
    DeploymentSchema.createDeploymentSchema,
    {},
    next,
  )
}

export const validateGetDeploymentArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    DeploymentSchema.getDeploymentSchema,
    {},
    next,
  )
}

export const validateListDeploymentsArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    DeploymentSchema.listDeploymentsSchema,
    {},
    next,
  )
}
