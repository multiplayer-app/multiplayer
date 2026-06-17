import type { Request, Response, NextFunction } from 'express'
import { CommentModel, ThreadModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const threadId = req.params.threadId as string

    await ThreadModel.deleteThreadById(threadId)
    await CommentModel.deleteCommentsByThreadId(threadId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
