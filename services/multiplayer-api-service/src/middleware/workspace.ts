import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel, WorkspaceUserModel } from '@multiplayer/models'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  InvalidArgumentError,
  RequestThrottledError,
} from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachWorkspace = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string

    const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

    if (!workspace) {
      return next(new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND))
    }

    req.workspace = workspace

    next()
  } catch (err) {
    next(err)
  }
}

export const attachWorkspaceUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.session.current) {
      return next(new UnauthorizedError())
    }
    const workspaceId = req.params.workspaceId as string

    if (!workspaceId) {
      return new InvalidArgumentError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(req.session.current, workspaceId)

    if (!workspaceUser) {
      return next(new ForbiddenError(ErrorMessage.WORKSPACE_USER_NOT_FOUND))
    }
    req.workspaceUser = workspaceUser
    next()
  } catch (err) {
    next(err)
  }
}
