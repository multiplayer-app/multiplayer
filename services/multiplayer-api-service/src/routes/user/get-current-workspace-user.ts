import type { Request, Response, NextFunction } from 'express'
import { NotFoundError } from 'restify-errors'
import { WorkspaceUserModel } from '@multiplayer/models'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.session?.current
    const workspaceId = req.params.workspaceId as string

    const workspaceUser = await WorkspaceUserModel.findWorkspaceUser(
      String(userId),
      workspaceId,
    )

    if (!workspaceUser) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_USER_NOT_FOUND)
    }

    const _workspaceUser = workspaceUser?.toObject()

    _workspaceUser.googleWorkspaceIntegration = !!workspaceUser?.googleWorkspaceToken?.access_token

    return res.status(200).json(_workspaceUser)
  } catch (err) {
    return next(err)
  }
}
