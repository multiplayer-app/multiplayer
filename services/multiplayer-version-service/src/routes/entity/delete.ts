import { NextFunction, Request, Response } from 'express'
import { CommitType, ErrorMessage } from '@multiplayer/types'
import { EntityModel } from '@multiplayer/models'
import {
  InternalServerError,
  InvalidArgumentError,
} from 'restify-errors'
import {
  AMQPLib,
  CommitLib,
  EntityLib,
} from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const entityId = req.params.entityId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      projectBranch,
      entity,
      workspaceUser,
      lastCommit,
      projectBranchState,
    } = req

    if (entity.default) {
      throw new InvalidArgumentError('Can not delete default entity')
    }

    if (
      // !workspaceUser
      !projectBranch
      || !lastCommit
    ) {
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }

    const { entityCommit: deleteEntityCommit } = await EntityLib.deleteEntity({
      entity,
      entityId,
      projectBranch,
    })

    const commit = await CommitLib.createCommit({
      projectBranch,
      lastCommit,
      entityCommits: [deleteEntityCommit],
      projectBranchState,
      message: 'delete entity',
      label: 'delete',
      type: CommitType.MANUAL,
      workspaceUsers: workspaceUser
        ? [workspaceUser?._id.toString()]
        : [],
    })

    await EntityModel.updateEntityInBranch(
      entityId,
      projectBranch._id,
      {
        deletedAtCommit: commit._id,
      },
    )

    await AMQPLib.notifyOnEntityDelete({
      workspaceId,
      projectId,
      entityId,
      branchId: projectBranchId,
      isDefaultBranch: !!projectBranch.default,
      entity: entity as any,
    })

    return res.status(200).json(commit)
  } catch (err) {
    return next(err)
  }
}
