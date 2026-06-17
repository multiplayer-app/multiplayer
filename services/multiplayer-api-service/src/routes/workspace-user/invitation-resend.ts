import type { Request, Response, NextFunction } from 'express'
import {
  InvalidArgumentError,
  NotFoundError,
  ForbiddenError,
} from 'restify-errors'
import {
  WorkspaceUserModel,
  WorkspaceModel,
} from '@multiplayer/models'
import {
  ErrorMessage,
  WorkspaceUserStatus,
} from '@multiplayer/types'
import { UserLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentWorkspaceUser = req.workspaceUser

    if (!currentWorkspaceUser) {
      throw new ForbiddenError()
    }

    const workspaceId = req.params.workspaceId as string
    const workspaceUserId = req.params.workspaceUserId as string

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUserById(workspaceUserId)

    if (!workspaceUser) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
    }

    const isMemberOfWorkspace = await WorkspaceModel.getWorkspaceByWorkspaceUserId(
      workspaceId,
      workspaceUserId,
    )

    if (!isMemberOfWorkspace) {
      throw new InvalidArgumentError(ErrorMessage.USER_IS_NOT_A_MEMBER)
    }

    if (workspaceUser.status !== WorkspaceUserStatus.PENDING) {
      throw new InvalidArgumentError(ErrorMessage.INVITATION_IS_ALREADY_ACCEPTED)
    }

    await UserLib.sendJoinWorkspaceInvitation(
      workspaceId,
      workspaceUser._id,
      workspaceUser.user,
      currentWorkspaceUser._id,
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
