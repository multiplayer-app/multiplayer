import type { Request, Response, NextFunction } from 'express'
import { CommitModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectBranchId = req.params.projectBranchId as string
    const commitId = req.params.commitId as string

    const commit = await CommitModel.findCommitById(commitId, projectBranchId)

    return res.status(200).json(commit)
  } catch (err) {
    return next(err)
  }
}
