import type { Request, Response, NextFunction } from 'express'
import { JoiValidator } from '@multiplayer/util'
import { WorkspaceUserSchema } from './schema'

export const validateResendWorkspaceInvitation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceUserSchema.resendWorkspaceUserInvitationSchema,
    {},
    next,
  )
}

export const validateListWorkspaceUsers = (
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
    WorkspaceUserSchema.listWorkspaceUsersSchema,
    {},
    next,
  )
}

export const validateInviteWorkspaceUser = (
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
    WorkspaceUserSchema.inviteWorkspaceUserSchema,
    {},
    next,
  )
}

export const validateUpdateWorkspaceUser = (
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
    WorkspaceUserSchema.updateWorkspaceUserSchema,
    {},
    next,
  )
}

export const validateDeleteWorkspaceUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceUserSchema.deleteWorkspaceUserSchema,
    {},
    next,
  )
}

export const validateLeaveWorkspace = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const args = {
    params: req.params,
  }

  JoiValidator.validateMiddleware(
    args,
    WorkspaceUserSchema.leaveWorkspaceSchema,
    {},
    next,
  )
}
