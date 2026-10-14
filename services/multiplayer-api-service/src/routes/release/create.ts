import type { Request, Response, NextFunction } from 'express'
import { ReleaseModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const payload = req.body

    const release = await ReleaseModel.upsertRelease({
      workspace: workspaceId,
      project: projectId,
      ...payload,
    })

    return res.status(200).json(release)
  } catch (err) {
    return next(err)
  }
}
