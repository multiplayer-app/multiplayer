import type { Request, Response, NextFunction } from 'express'
import { WorkspaceUserModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const payload = req.body

    const workspaceUser = await WorkspaceUserModel.updateWorkspaceUser(
      String(req.session.current),
      workspaceId,
      payload,
    )

    return res.status(200).json(workspaceUser)
  } catch (err) {
    return next(err)
  }
}
