import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const workspaceDomainId = req.params.workspaceDomainId as string

    await WorkspaceModel.removeDomain(
      workspaceId,
      workspaceDomainId,
    )

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
