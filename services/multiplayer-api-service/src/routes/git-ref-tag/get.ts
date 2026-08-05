import type { Request, Response, NextFunction } from 'express'
import {
  GitRefTagModel,
  ProjectBranchModel,
} from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitRefTagId = req.params.gitRefTagId as string
    const projectBranchId = req.params.projectBranchId as string

    const projectBranches = await ProjectBranchModel.getProjectBranchTree(projectBranchId)
    const gitRefTag = await GitRefTagModel.findGitRefTagById(
      gitRefTagId,
      projectBranches.map(({ _id }) => _id),
    )

    return res.status(200).json(gitRefTag)
  } catch (err) {
    return next(err)
  }
}
