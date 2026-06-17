import type { Request, Response, NextFunction } from 'express'
import { WorkspaceUserModel } from '@multiplayer/models'
import { ErrorMessage } from '@multiplayer/types'
import {
  NotFoundError,
  ForbiddenError,
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
