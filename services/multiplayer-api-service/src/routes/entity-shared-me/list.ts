import type { NextFunction, Request, Response } from 'express'
import {
  WorkspaceUserModel,
  EntityModel,
  Config as MongoModelConfig,
  SortOrder,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { WorkspaceUserStatus } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id as ObjectId
    const skip = 'skip' in req.query ? Number(req.query.skip) : MongoModelConfig.SKIP
    const limit = 'limit' in req.query ? Number(req.query.limit) : MongoModelConfig.LIMIT
    const sortDirection = req.query.sortDirection as SortOrder | undefined
    const sortKey = req.query.sortKey as string | undefined

    const workspaceUsers = await WorkspaceUserModel.findWorkspaceUsersByUserId(
      currentUserId,
      undefined,
    )

    const entities = await EntityModel.getSharedEntities(
      {
        sharedWithWorkspaceUser: workspaceUsers.map(({ _id }) => _id),
      },
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
