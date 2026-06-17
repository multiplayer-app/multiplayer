import type { Request, Response, NextFunction } from 'express'
import {
  CommentModel,
  EntityModel,
  ThreadModel,
  IWorkspaceUserDocument, ProjectBranchModel, IEntityDocument,
} from '@multiplayer/models'
import {
  ErrorMessage,
  IThreadResponse,
  ThreadStatus,
  ObjectTypeEnum,
} from '@multiplayer/types'
import { NotFoundError } from 'restify-errors'
import { ObjectId } from '@multiplayer/mongo'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      workspace,
      project,
    } = req
    const workspaceUser = req.workspaceUser as IWorkspaceUserDocument
    const projectId = req.params.projectId as string
    const {
      branch,
      objectId,
      objectType,
      commentablePath,
      position,
      content,
    }: {
      branch: string,
      objectId: string,
      objectType: ObjectTypeEnum,
      commentablePath: string[],
      position: number[],
      content: string
    } = req.body

    const projectBranches = await ProjectBranchModel.getProjectBranchTree(branch)
    let entityDoc: IEntityDocument | undefined
    if (objectId && objectType === ObjectTypeEnum.ENTITY) {
      // check if entity belongs to branch
      entityDoc = await EntityModel.getEntityInBranchByEntityId(
        objectId,
        projectBranches.map(({ _id }) => _id),
        {
          project: projectId,
        },
      )
      if (!entityDoc) {
        return next(new NotFoundError(ErrorMessage.ENTITY_NOT_FOUND))
      }
    }

    const commentId = new ObjectId()
    const thread = await ThreadModel.createThread({
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      branch,
      objectId,
      objectType,
      commentablePath,
      position,
      initiator: workspaceUser._id.toString(),
      usersInDiscussion: [workspaceUser._id.toString()],
      status: ThreadStatus.ACTIVE,
      lastActivityAt: (new Date()).toString(),
      totalComments: 1,
      firstComment: commentId.toString(),
    })

    const comment = await CommentModel.createComment({
      _id: commentId.toString(),
      workspace: workspace._id.toString(),
      project: project._id.toString(),
      objectId,
      objectType,
      branch,
      thread: thread._id.toString(),
      content,
      workspaceUser: workspaceUser._id.toString(),
    })

    const response: IThreadResponse = {
      ...thread.toJSON(),
      comments: [comment.toJSON()],
    }

    return res.status(200).json(response)
  } catch (err) {
    return next(err)
  }
}
