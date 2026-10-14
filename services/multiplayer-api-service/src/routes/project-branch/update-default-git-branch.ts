import type { Request, Response, NextFunction } from 'express'
import { ProjectBranchModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const gitRepositoryId = req.params.gitRepositoryId as string
    const branchName = req.body.branchName as string
    const updatedBranch = await ProjectBranchModel.updateProjectBranchById(
      projectBranchId,
      {
        [`gitBranches.${gitRepositoryId}`]: branchName,
      },
    )
    return res.status(200).json(updatedBranch)
  } catch (err) {
    return next(err)
  }
}
