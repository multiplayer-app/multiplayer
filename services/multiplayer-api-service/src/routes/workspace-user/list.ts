import type { Request, Response, NextFunction } from 'express'
import { WorkspaceModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const workspaceUsers = await WorkspaceModel.listUsers(
      workspaceId,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(workspaceUsers)
  } catch (err) {
    return next(err)
  }
}
