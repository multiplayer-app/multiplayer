import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel, EntityModel } from '@multiplayer/models'
import { ForbiddenError } from 'restify-errors'
import { AMQPLib } from '../../lib'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string
    const workspaceId = req.params.workspaceId as string
    const projectId = req.params.projectId as string
    const projectBranch = req.projectBranch

    if (projectBranch.default) {
      return next(new ForbiddenError('Revert action is not allowed on default branch'))
    }

    const entity = await EntityModel.getEntityInBranchByEntityId(
      entityId,
      projectBranchId,
      { deleted: true },
    )

    if (!entity) {
      return res.sendStatus(204)
    }
    await EntityModel.deleteEntityInBranch(entity.entityId, projectBranchId)
    await EntityCommitModel.deleteEntityCommits({
      workspaceId, projectId, entityId, projectBranchId,
    })
    await AMQPLib.notifyOnEntityDelete({
      workspaceId,
      projectId,
      entityId,
      branchId: projectBranchId,
      isDefaultBranch: !!projectBranch.default,
      entity: entity.toJSON(),
    })
    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
