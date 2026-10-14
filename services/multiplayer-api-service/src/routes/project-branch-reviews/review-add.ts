import type { Request, Response, NextFunction } from 'express'
import {
  CommentModel, ICommentDocument,
  IThreadDocument,
  IWorkspaceUserDocument,
  ProjectBranchModel,
  ThreadModel,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { ThreadStatus } from '@multiplayer/types'
import { AMQPLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceUser = req.workspaceUser as IWorkspaceUserDocument
    const projectBranchId = req.params.projectBranchId as string
    const projectId = req.params.projectId as string
    const workspaceId = req.params.workspaceId as string
    const { comment, state } = req.body

    let thread: IThreadDocument | undefined
    let commentDoc: ICommentDocument | undefined
    if (comment) {
      const commentId = new ObjectId()
      thread = await ThreadModel.createThread({
        workspace: workspaceId,
        project: projectId,
        branch: projectBranchId,
        initiator: workspaceUser?._id.toString(),
        usersInDiscussion: [workspaceUser._id.toString()],
        status: ThreadStatus.ACTIVE,
        lastActivityAt: (new Date()).toString(),
        totalComments: 1,
        firstComment: commentId.toString(),
      })

      commentDoc = await CommentModel.createComment({
        _id: commentId.toString(),
        workspace: workspaceUser?.workspace,
        project: projectId,
        branch: projectBranchId,
        thread: thread._id.toString(),
        content: comment,
        workspaceUser: workspaceUser._id.toString(),
      })
    }

    const projectBranchReview = await ProjectBranchModel.addReview(
      projectBranchId,
      workspaceUser?._id as ObjectId,
      { state, thread: thread?._id },
    )

    res.status(200).json(projectBranchReview)

    if (thread && commentDoc) {
      await AMQPLib.notifyOnThreadCreate({
        thread: thread.toJSON(),
        comment: commentDoc.toJSON(),
      })
    }
  } catch (err) {
    return next(err)
  }
}
