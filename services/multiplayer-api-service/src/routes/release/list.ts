import type { Request, Response, NextFunction } from 'express'
import { ReleaseModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortDirection = req.query.sortDirection
      ? Number(req.query.sortDirection) as -1 | 1
      : -1
    const sortKey = req.query.sortKey
      ? req.query.sortKey as string
      : '_id'
    const version = req.query.version as string | undefined

    const entity = req.query.entity as string | undefined

    const filter: {
      workspace: string,
      project: string,
      entity?: string
      version?: string
    } = {
      workspace: workspaceId,
      project: projectId,
      entity,
      version,
    }

    const releases = await ReleaseModel.findReleases(
      filter,
      {
        skip,
        limit,
      },
      {
        sortKey,
        sortDirection,
      },
    )

    return res.status(200).json(releases)
  } catch (err) {
    return next(err)
  }
}
