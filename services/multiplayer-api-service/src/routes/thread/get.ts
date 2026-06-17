import type { Request, Response, NextFunction } from 'express'
import { CommentModel, ThreadModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const threadId = req.params.threadId as string

    const threadResp = await ThreadModel.findThreadById(threadId)

    if (!threadResp) {
      return next(new NotFoundError(ErrorMessage.THREAD_NOT_FOUND))
    }
    const firstComment = await CommentModel.findCommentById(threadResp.firstComment)

    return res.status(200).json({
      ...threadResp.toJSON(),
      firstComment,
    })
  } catch (err) {
    return next(err)
  }
}
