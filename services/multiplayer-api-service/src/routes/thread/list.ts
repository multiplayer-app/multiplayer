import type { Request, Response, NextFunction } from 'express'
import { CommentModel, ThreadModel, SortOrder } from '@multiplayer/models'
import {
  ThreadStatus,
  ObjectTypeEnum,
} from '@multiplayer/types'
import { MongoPayload } from '@multiplayer/util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const branchId = req.query.branchId as string
    const branchOnly = req.query.branchOnly === 'true'
    const objectId = req.query.objectId as string
    const objectType = req.query.objectType as ObjectTypeEnum
    const status = req.query.status as string
    const search = req.query.search as string
    const sortOrder = SortOrder[req.query.sortOrder as string] || SortOrder.ASC

    const matchedThreads = await CommentModel.searchThreadsByComments(
      projectId,
      {
        branch: branchId,
        objectId,
        objectType,
        status: ThreadStatus[status],
        search,
        branchOnly,
      },
      {
        skip,
        limit,
      },
      sortOrder,
    )
    const threads = await ThreadModel.findThreads(
      projectId,
      {
        threads: matchedThreads.data.map(({ _id }) => _id),
      },
      { limit },
      sortOrder,
    )

    const filter = MongoPayload.removeUndefinedProps({ status: ThreadStatus[status] })
    const totalComments = await CommentModel.findComments({
      ...filter,
      branch: branchId,
      objectId,
      objectType,
      project: projectId,
      branchOnly,
    }, { limit: 1 })

    return res.status(200).json({
      ...threads,
      totalComments: totalComments.cursor.total,
    })
  } catch (err) {
    return next(err)
  }
}
