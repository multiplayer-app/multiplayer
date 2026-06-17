import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'
import { IAccess } from '@multiplayer/types'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const access = req.body as IAccess

    const updatedAccess = await WorkspaceModel.updateWorkspaceAccess(workspaceId, access)

    await AccessControlContext.invalidateContext({
      workspaceId,
    })

    return res.status(200).json(updatedAccess)
  } catch (err) {
    return next(err)
  }
}
