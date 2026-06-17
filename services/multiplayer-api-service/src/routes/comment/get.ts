import type { Request, Response, NextFunction } from 'express'
import { CommentModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = req.params.commentId as string
    const comment = await CommentModel.findCommentById(commentId)

    return res.status(200).json(comment)
  } catch (err) {
    return next(err)
  }
}
