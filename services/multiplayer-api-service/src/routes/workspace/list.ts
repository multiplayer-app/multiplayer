import type { Request, Response, NextFunction } from 'express'
import {
  WorkspaceModel,
  WorkspaceUserModel,
} from '@multiplayer/models'
import { WorkspaceUserStatus } from '@multiplayer/types'
import type { ObjectId } from '@multiplayer/mongo'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = req.user?._id as ObjectId
    const archived = Boolean(req.query.archived)
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const workspaceUsers = await WorkspaceUserModel.findWorkspaceUsersByUserId(
      currentUserId,
      undefined,
      { status: WorkspaceUserStatus.ACTIVE },
    )

    const filter: {
      _id: ObjectId[] | string[]
      archived?: boolean,
      workspaceUsers?: string[]
    } = {
      _id: workspaceUsers.map(({ workspace }) => workspace),
      archived,
    }

    const workspaces = await WorkspaceModel.findWorkspaces(
      filter,
      {
        skip,
        limit,
      },
    )

    return res.status(200).json(workspaces)
  } catch (err) {
    return next(err)
  }
}
