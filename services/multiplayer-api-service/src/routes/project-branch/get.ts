import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string

    const projectBranch = await ProjectBranchModel.findProjectBranchById(projectBranchId)

    return res.status(200).json(projectBranch)
  } catch (err) {
    return next(err)
  }
}
