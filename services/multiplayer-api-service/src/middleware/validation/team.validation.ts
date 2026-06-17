import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { TeamSchema } from './schema'

export const validateListTeams = (
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
    TeamSchema.listTeamSchema,
    { updateQuery: true },
    next,
    req,
  )
}

export const validateGetTeam = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TeamSchema.getTeamSchema,
    {},
    next,
  )
}

export const validateCreateTeam = (
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
    TeamSchema.createTeamSchema,
    {},
    next,
  )
}

export const validateUpdateTeam = (
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
    TeamSchema.updateTeamSchema,
    {},
    next,
  )
}

export const validateUpdateTeamIcon = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TeamSchema.updateTeamIconSchema,
    {},
    next,
  )
}

export const validateDeleteTeam = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TeamSchema.deleteTeamSchema,
    {},
    next,
  )
}

export const validateListTeamUsers = (
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
    TeamSchema.listTeamUsersSchema,
    {},
    next,
  )
}

export const validateUpdateTeamUser = (
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
    TeamSchema.updateTeamUserSchema,
    {},
    next,
  )
}

export const validateDeleteTeamUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TeamSchema.deleteTeamUserSchema,
    {},
    next,
  )
}

export const validateListTeamProjects = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    TeamSchema.listTeamProjectsSchema,
    {},
    next,
  )
}

export const validateAddProjectToTeam = (
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
    TeamSchema.addProjectToTeamSchema,
    {},
    next,
  )
}

export const validateRemoveProjectFromTeam = (
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
    TeamSchema.removeProjectFromTeamSchema,
    {},
    next,
  )
}
