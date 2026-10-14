import { NextFunction, Request, Response } from 'express'
import { EntityCommitModel, EntityModel } from '@multiplayer/models'
import { EntityCommitChangeType, ErrorMessage, IEntityCommit } from '@multiplayer/types'
import { InternalServerError } from 'restify-errors'
import { EntityUpdateLib } from '../../lib'


export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string
    const entityCommit = req.entityCommit
    if (!entityCommit) {
      throw new InternalServerError(ErrorMessage.INTERNAL_ERROR_NO_REQUIRED_DATA)
    }
    await EntityUpdateLib.commitUpdatesIfAvailable(req.projectBranch, {
      workspace: workspaceId,
      project: projectId,
      projectBranch: projectBranchId,
      entityId: entityId,
    })
    const { data: [parentChange] } = await EntityCommitModel.getChangesInBranch(
      projectBranchId,
      {
        entity: entityId,
      },
    )
    if (!parentChange) {
      throw new InternalServerError(ErrorMessage.ENTITY_STATE_IN_BRANCH_NOT_FOUND)
    }

    const payload: IEntityCommit = {
      ...entityCommit.toJSON(),
      _id: undefined,
      commit: undefined,
      changeType: EntityCommitChangeType.UPDATE,
      projectBranch: projectBranchId,
      baseEntityCommit: parentChange.entityCommit.baseEntityCommit.toString(),
      parentEntityCommit: parentChange.entityCommit._id,
    }
    const resetEntityCommit = await EntityCommitModel.createEntityCommit(payload)
    await EntityModel.updateEntityInBranch(
      resetEntityCommit.entity,
      resetEntityCommit.projectBranch,
      {
        key: resetEntityCommit.meta.entityName,
        metadata: resetEntityCommit.meta.summary,
      },
    )
    return res.status(200).json(resetEntityCommit)
  } catch (err) {
    return next(err)
  }
}
