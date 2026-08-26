import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel } from '@multiplayer/models'
import { MongoPayload } from '@multiplayer/util'
import { EntityCommitChangeType, EntityType } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const sortDirection = Number(req.query.sortDirection)
    const sortKey = req.query.sortKey as string
    const { changeType, entityType, commit } = req.query
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined

    const filter: {
      changeType?: EntityCommitChangeType,
      entityType?: EntityType,
      afterCommit?: string,
    } = {
      changeType: changeType as EntityCommitChangeType,
      entityType: entityType as EntityType,
      afterCommit: commit as string,
    }

    const changes = await EntityCommitModel.getChangesInBranch(
      projectBranchId,
      MongoPayload.removeUndefinedProps(filter),
      {
        skip,
        limit,
      },
      { sortKey, sortDirection },
    )

    return res.status(200).json(changes)
  } catch (err) {
    return next(err)
  }
}
