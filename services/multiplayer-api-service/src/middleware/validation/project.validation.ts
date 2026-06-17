import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { ProjectSchema } from './schema'

export const validateListProjects = (
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
    ProjectSchema.listProjectsSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetProject = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectSchema.getProjectSchema,
    {},
    next,
  )
}

export const validateGetProjectAggregatedRole = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectSchema.getProjectAggregatedRoleSchema,
    {},
    next,
  )
}

export const validateCreateProject = (
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
    ProjectSchema.createProjectSchema,
    {},
    next,
  )
}

export const validateUpdateProject = (
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
    ProjectSchema.updateProjectSchema,
    {},
    next,
  )
}

export const validateUpdateProjectIcon= (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectSchema.updateProjectIconSchema,
    {},
    next,
  )
}

export const validateUpdateProjectCoverImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectSchema.updateProjectCoverImageSchema,
    {},
    next,
  )
}

export const validateDeleteProject = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectSchema.deleteProjectSchema,
    {},
    next,
  )
}

export const validateAddProjectUser = (
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
    ProjectSchema.addProjectUserSchema,
    {},
    next,
  )
}

export const validateListProjectUsers = (
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
    ProjectSchema.listProjectUsersSchema,
    {},
    next,
  )
}

export const validateUpdateProjectUser = (
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
    ProjectSchema.updateProjectUserSchema,
    {},
    next,
  )
}

export const validateDeleteProjectUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectSchema.deleteProjectUserSchema,
    {},
    next,
  )
}

export const validateUpdateProjectAccess = (
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
    ProjectSchema.updateProjectAccessSchema,
    {},
    next,
  )
}

export const validateGetProjectAccessPermissions = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    ProjectSchema.getProjectAccessPermissionsSchema,
    {},
    next,
  )
}
