import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ProjectLinkSchema } from './schema'

export const validateListProjectLinks = (
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
    ProjectLinkSchema.listProjectLinksSchema,
    { updateQuery: true },
    next,
    req,
  )
}
export const validateGetChangedProjectLinks = (
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
    ProjectLinkSchema.getChangedProjectLinks,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetProjectLink = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectLinkSchema.getProjectLinkSchema,
    {},
    next,
  )
}

export const validateCreateProjectLink = (
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
    ProjectLinkSchema.createProjectLinkSchema,
    {},
    next,
  )
}
export const validateBulkCreateProjectLink = (
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
    ProjectLinkSchema.bulkCreateProjectLinkSchema,
    {},
    next,
  )
}

export const validateUpdateProjectLink = (
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
    ProjectLinkSchema.updateProjectLinkSchema,
    {},
    next,
  )
}

export const validateDeleteProjectLink = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectLinkSchema.deleteProjectLinkSchema,
    {},
    next,
  )
}
export const validateDeleteProjectLinkByParams = (
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
    ProjectLinkSchema.deleteProjectLinkByParamsSchema,
    {},
    next,
  )
}
