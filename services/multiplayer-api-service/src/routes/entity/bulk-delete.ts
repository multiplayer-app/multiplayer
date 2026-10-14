import type { NextFunction, Request, Response } from 'express'
import {
  CommitType,
  ErrorMessage,
  EntityType,
} from '@multiplayer/types'
import { EntityModel } from '@multiplayer/models'
import { InternalServerError } from 'restify-errors'
import {
  AMQPLib,
  CommitLib,
  EntityLib,
  // ProjectLinkLib,
} from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const {
      projectBranch,
      workspaceUser,
      lastCommit,
      projectBranchState,
    } = req
    const {
      type,
      entityIds,
    } = req.body as {
      type?: EntityType,
      entityIds?: string[]
    }

    if (
      !workspaceUser
      || !projectBranch
      || !lastCommit
      || (
        !entityIds?.length
        && !type
      )
    ) {
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }

    const deleteResults = await EntityLib.bulkDeleteEntities({
      workspaceId,
      projectId,
      projectBranch,
      entityIds,
      type,
      default: false,
    })

    // await Promise.all([
    //   ProjectLinkLib.deleteProjectLink(
    //     projectBranchId,
    //     {
    //       sourceObjectId: entityIds,
    //     },
    //   ),
    //   ProjectLinkLib.deleteProjectLink(
    //     projectBranchId,
    //     {
    //       targetObjectId: entityIds,
    //     },
    //   ),
    // ])

    if (!deleteResults.length) {
      return res.sendStatus(204)
    }

    const commit = await CommitLib.createCommit({
      projectBranch,
      lastCommit,
      entityCommits: deleteResults.map(({ entityCommit }) => entityCommit),
      projectBranchState,
      message: 'delete entity',
      label: 'delete',
      type: CommitType.AUTO,
      workspaceUsers: [workspaceUser._id.toString()],
    })

    await EntityModel.updateEntityInBranch(
      deleteResults.map(({ entity }) => entity.entityId),
      projectBranch._id,
      {
        deletedAtCommit: commit._id,
      },
    )

    await Promise.all(deleteResults.map(({ entity }) =>
      AMQPLib.notifyOnEntityDelete({
        workspaceId,
        projectId,
        entityId: entity.entityId.toString(),
        branchId: projectBranchId,
        isDefaultBranch: !!projectBranch.default,
        entity: entity as any,
      }),
    ))

    return res.status(200).json(commit)
  } catch (err) {
    return next(err)
  }
}
