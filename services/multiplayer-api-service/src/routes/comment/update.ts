import type { Request, Response, NextFunction } from 'express'
import { CommentModel, ThreadModel } from '@multiplayer/models'
import { ForbiddenError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = req.params.commentId as string
    const { content } = req.body

    let comment = await CommentModel.findCommentById(
      commentId,
    )
    if (!comment || !req.workspaceUser?._id.equals(comment.workspaceUser)) {
      return next(new ForbiddenError(ErrorMessage.COMMENT_BELONGS_TO_OTHER_USER))
    }

    comment = await CommentModel.updateCommentById(
      commentId,
      {
        content,
      },
    )

    if (comment) {
      await ThreadModel.updateThreadById(
        comment.thread,
        {
          lastActivityAt: comment.updatedAt,
        },
      )
    }

    return res.status(200).json(comment)
  } catch (err) {
    return next(err)
  }
}
