import type { Request, Response, NextFunction } from 'express'
import { EntityCommitModel } from '@multiplayer/models'

export default async (
  req: Request, res: Response, next: NextFunction,
) => {
  try {
    const projectBranchId = req.params.projectBranchId as string

    const changesStats = await EntityCommitModel
      .getChangesStatsInBranch(projectBranchId)

    return res.status(200).json(changesStats)
  } catch (err) {
    return next(err)
  }
}
