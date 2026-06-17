import type { NextFunction, Request, Response } from 'express'
import {
  EntityModel,
  SortOrder,
  Config as MongoModelConfig,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string

    const skip = 'skip' in req.query ? Number(req.query.skip) : MongoModelConfig.SKIP
    const limit = 'limit' in req.query ? Number(req.query.limit) : MongoModelConfig.LIMIT
    const sortDirection = req.query.sortDirection as SortOrder | undefined
    const sortKey = req.query.sortKey as string | undefined

    const filter = {
      workspace: workspaceId,
      project: projectId,
    }

    const entities = await EntityModel.getSharedEntities(
      filter,
      {
        skip,
        limit,
      },
      sortDirection && sortKey
        ? {
          sortDirection,
          sortKey,
        }
        : undefined,
    )

    return res.status(200).json(entities)
  } catch (err) {
    return next(err)
  }
}
