import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string

    const workspace = await WorkspaceModel.findWorkspaceById(workspaceId)

    if (!workspace) {
      throw new NotFoundError(ErrorMessage.WORKSPACE_NOT_FOUND)
    }

    const workspaceObject = workspace.toObject()

    workspaceObject.access = {
      ...(workspaceObject.access || {}),
      permissions: req.access.permissions,
    }

    return res.status(200).json(workspaceObject)
  } catch (err) {
    return next(err)
  }
}
