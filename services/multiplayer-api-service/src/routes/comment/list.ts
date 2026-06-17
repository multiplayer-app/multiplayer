import type { Request, Response, NextFunction } from 'express'
import { CommentModel, SortOrder } from '@multiplayer/models'
import {
  ThreadStatus,
  ObjectTypeEnum,
} from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string
    const threadId = req.query.threadId as string
    const branchId = req.query.branchId as string
    const objectId = req.query.objectId as string
    const objectType = req.query.objectType as ObjectTypeEnum
    const status = req.query.status as string
    const skip = 'skip' in req.query ? Number(req.query.skip) : undefined
    const limit = 'limit' in req.query? Number(req.query.limit) : undefined
    const sortOrder = SortOrder[req.query.sortOrder as string] || SortOrder.ASC

    const filter = {
      thread: threadId,
      objectId,
      objectType,
      branch: branchId,
      status: ThreadStatus[status],
      project: projectId,
    }
    const comments = await CommentModel.findComments(
      filter,
      {
        skip,
        limit,
      },
      sortOrder,
    )

    return res.status(200).json(comments)
  } catch (err) {
    return next(err)
  }
}
