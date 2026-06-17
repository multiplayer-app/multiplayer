import type { Request, Response, NextFunction } from 'express'
import {
  CommentModel,
  ThreadModel,
  IWorkspaceUserDocument,
} from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceUser = req.workspaceUser as IWorkspaceUserDocument

    const projectId = req.params.projectId as string
    const { content, threadId } = req.body

    const thread = await ThreadModel.findThreadById(threadId)
    if (!thread || !thread.project.equals(projectId)) {
      throw new NotFoundError(ErrorMessage.THREAD_NOT_FOUND)
    }

    const comment = await CommentModel.createComment({
      workspace: workspaceUser.workspace,
      project: projectId,
      branch: thread.branch,
      thread: threadId,
      objectId: thread.objectId,
      objectType: thread.objectType,
      content,
      workspaceUser: workspaceUser._id.toString(),
    })

    await ThreadModel.updateThreadById(
      threadId,
      {
        lastActivityAt: comment.updatedAt,
        $addToSet: {
          usersInDiscussion: workspaceUser._id.toString(),
        },
        $inc: {
          totalComments: 1,
        },
      },
    )

    return res.status(200).json(comment)
  } catch (err) {
    return next(err)
  }
}
