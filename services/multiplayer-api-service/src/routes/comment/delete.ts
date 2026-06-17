import type { Request, Response, NextFunction } from 'express'
import { CommentModel, IThreadDocument, ThreadModel } from '@multiplayer/models'
import { UpdateQuery } from 'mongoose'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const commentId = req.params.commentId as string
    const projectId = req.params.projectId as string
    const comment = await CommentModel.findCommentAndDeleteById(commentId)
    const thread = await ThreadModel.findThreadById(comment.thread)

    if (!comment) return res.sendStatus(204)
    if (!thread) return res.sendStatus(204)

    if (thread.totalComments === 1) {
      await ThreadModel.deleteThreadById(comment.thread.toString())
      return res.sendStatus(204)
    }

    const payload: UpdateQuery<IThreadDocument> = { $inc: { totalComments: -1 } }
    if (thread.firstComment.equals(commentId)) {
      // looking for next comment
      const commentsData = await CommentModel.findComments({ project: projectId, thread: comment.thread }, { limit: 1 })
      payload.firstComment = commentsData.data[0]._id
    }

    const userComments = await CommentModel.findComments({
      project: projectId,
      thread: comment.thread,
      workspaceUser: comment.workspaceUser }, { limit: 1 })

    if (userComments.cursor.total === 0) {
      payload['$pull'] = { usersInDiscussion: comment.workspaceUser }
    }

    await ThreadModel.updateThreadById(comment.thread, payload)
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
