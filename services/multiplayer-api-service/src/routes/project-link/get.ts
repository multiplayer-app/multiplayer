import type { Request, Response, NextFunction } from 'express'
import {
  ProjectLinkModel,
  ProjectBranchModel,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectLinkId = req.params.projectLinkId as string
    const projectBranchId = req.params.projectBranchId as string

    const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
    const projectLink = await ProjectLinkModel.findProjectLinkById(
      projectLinkId,
      projectBranches.map(({ _id }) => _id),
    )

    return res.status(200).json(projectLink)
  } catch (err) {
    return next(err)
  }
}
