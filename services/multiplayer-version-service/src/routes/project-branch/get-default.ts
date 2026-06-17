import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string

    const projectBranch = await ProjectBranchModel.getDefaultProjectBranch(projectId)

    return res.status(200).json(projectBranch)
  } catch (err) {
    return next(err)
  }
}
