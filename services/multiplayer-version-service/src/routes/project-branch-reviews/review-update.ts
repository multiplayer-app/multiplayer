import type { Request, Response, NextFunction } from 'express'
import {
  CommentModel, ICommentDocument, IThreadDocument,
  IWorkspaceUserDocument,
  ProjectBranchModel,
  ThreadModel,
} from '@multiplayer/models'
import { ObjectId } from '@multiplayer/mongo'
import { ErrorMessage, ThreadStatus } from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { AMQPLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceUser = req.workspaceUser as IWorkspaceUserDocument
    const projectBranchId = req.params.projectBranchId as string
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const { state, comment } = req.body

    const projectBranch = await ProjectBranchModel.findProjectBranchById(
      projectBranchId,
    )
    if (!projectBranch) {
      return next(new NotFoundError(ErrorMessage.PROJECT_BRANCH_NOT_FOUND))
    }

    const review = projectBranch.reviews.find((review) =>
      workspaceUser._id.equals(review.workspaceUser))

    if (!review) {
      return next(new NotFoundError(ErrorMessage.PROJECT_BRANCH_REVIEW_NOT_FOUND))
    }

    let threadId = review.thread
    const isThreadUpdate = !!comment && !!threadId

    let thread: IThreadDocument | undefined
    let commentDoc: ICommentDocument | undefined

    if (comment) {
      const commentId = new ObjectId()
      if (!threadId) {
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
        threadId = thread._id
      }

      commentDoc = await CommentModel.createComment({
        _id: commentId.toString(),
        workspace: workspaceUser?.workspace,
        project: projectId,
        branch: projectBranchId,
        thread: threadId.toString(),
        content: comment,
        workspaceUser: workspaceUser._id.toString(),
      })
      if (isThreadUpdate) {
        thread = await ThreadModel.updateThreadById(
          threadId,
          {
            lastActivityAt: commentDoc.updatedAt,
            $addToSet: {
              usersInDiscussion: workspaceUser._id.toString(),
            },
            $inc: {
              totalComments: 1,
            },
          },
        )
      }
    }
    const projectBranchReview = await ProjectBranchModel.updateReview(
      projectBranchId,
      workspaceUser?._id as ObjectId,
      { state, thread: threadId },
    )

    res.status(200).json(projectBranchReview)

    if (thread && commentDoc && isThreadUpdate) {
      await AMQPLib.notifyOnCommentCreate({
        thread: thread.toJSON(),
        comment: commentDoc.toJSON(),
      })
    } else if (thread && commentDoc) {
      await AMQPLib.notifyOnThreadCreate({
        thread: thread.toJSON(),
        comment: commentDoc.toJSON(),
      })
    }
  } catch (err) {
    return next(err)
  }
}
