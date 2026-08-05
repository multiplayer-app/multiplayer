import type { Request, Response, NextFunction } from 'express'
import { EntityUpdateLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const projectId = req.params.projectId as string
    const workspaceId = req.params.workspaceId as string
    const entityId = req.params.entityId as string
    const projectBranch = req.projectBranch

    await EntityUpdateLib.commitUpdatesIfAvailable(projectBranch, {
      workspace: workspaceId,
      project: projectId,
      projectBranch: projectBranchId,
      entityId: entityId,
    })

    res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
