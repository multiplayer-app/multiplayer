import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'
import { AccessControlContext } from '@multiplayer/auth'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const payload = req.body

    const workspace = await WorkspaceModel.updateWorkspaceById(workspaceId, payload)

    await AccessControlContext.invalidateContext({
      workspaceId,
    })

    return res.status(200).json(workspace)
  } catch (err) {
    return next(err)
  }
}
