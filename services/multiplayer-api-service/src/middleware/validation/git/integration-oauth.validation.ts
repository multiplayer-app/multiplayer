import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { IntegrationOAuthSchema } from './schema'

export const validateCreateBitbucketOAuthIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationOAuthSchema.createBitbucketOAuthIntegrationSchema,
    {},
    next,
  )
}

export const validateCreateGitlabOAuthIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationOAuthSchema.createGitlabOAuthIntegrationSchema,
    {},
    next,
  )
}

export const validateCreateGithubOAuthIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationOAuthSchema.createGithubOAuthIntegrationSchema,
    {},
    next,
  )
}

export const validateCreateAtlassianOAuthIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationOAuthSchema.createGithubOAuthIntegrationSchema,
    {},
    next,
  )
}

export const validateCreateLinearOAuthIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationOAuthSchema.createGithubOAuthIntegrationSchema,
    {},
    next,
  )
}

export const validateCreateSlackOAuthIntegrationArgs = (req: Request, res: Response, next: NextFunction) => {
  const args = {
    query: req.query,
  }

  JoiValidator.validateMiddleware(
    args,
    IntegrationOAuthSchema.createSlackOAuthIntegrationSchema,
    {},
    next,
  )
}
