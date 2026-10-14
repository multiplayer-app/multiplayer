import type { Request, Response, NextFunction } from 'express'
import { WorkspaceUserModel } from '@multiplayer/models'
import { ErrorMessage } from '@multiplayer/types'
import {
  NotFoundError,
  ForbiddenError, InternalServerError,
} from 'restify-errors'

export const attachWorkspaceUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const workspaceUserId = req?.context?.workspaceUserId

  if (req.isInternal && !workspaceUserId) {
    return next()
  }

  if (!workspaceUserId) {
    return next(new ForbiddenError(ErrorMessage.WORKSPACE_USER_NOT_FOUND))
  }

  const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(
    workspaceUserId,
  )

  if (!workspaceUser) {
    return next(new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND))
  }

  req.workspaceUser = workspaceUser

  next()
}
export const attachInternalWorkspaceUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.isInternal) {
    return next(new ForbiddenError('Middleware is for internal usage only'))
  }

  const workspaceUsers = req.body.workspaceUsers
  if (!workspaceUsers.length) {
    return next(new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA))
  }

  const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(
    workspaceUsers[0],
  )

  if (!workspaceUser) {
    return next(new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND))
  }

  req.workspaceUser = workspaceUser

  next()
}
