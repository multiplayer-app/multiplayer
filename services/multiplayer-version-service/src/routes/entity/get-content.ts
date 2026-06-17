import type { Request, Response, NextFunction } from 'express'
import { EntityContentModel, EntityModel, ProjectBranchModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string

    const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
    const branchIds = projectBranches.map(({ _id }) => _id)

    const entity = await EntityModel.getEntityInBranchByEntityId(
      entityId,
      branchIds,
    )

    if (!entity || entity.deletedAtCommit) {
      return next(new NotFoundError('Entity does not exist'))
    }

    const content = await EntityContentModel.getEntityContentByEntityIdAndBranchMap(entity.entityId, branchIds)
    return res.status(200).json(content)
  } catch (err) {
    return next(err)
  }
}
