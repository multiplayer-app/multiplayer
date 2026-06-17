import type { Request, Response, NextFunction } from 'express'
import { EntityModel, ProjectBranchModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const entityId = req.params.entityId as string

    const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)

    const entity = await EntityModel.getEntityInBranchByEntityId(
      entityId,
      projectBranches.map(({ _id }) => _id),
    )

    return res.status(200).json(entity)
  } catch (err) {
    return next(err)
  }
}
