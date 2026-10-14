import type { Request, Response, NextFunction } from 'express'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = req.integration
    const repositoryId = req.params.repositoryId as string
    const {
      name,
      parentBranch: parentBranchId,
    } = req.body

    const parentBranch = await GitProviderUtil.getBranch(
      integration,
      decodeURIComponent(repositoryId),
      parentBranchId,
    )

    const { lastCommitSha } = parentBranch

    const newBranch = await GitProviderUtil.createBranch(
      integration,
      decodeURIComponent(repositoryId),
      name,
      lastCommitSha,
    )

    return res.status(200).json(newBranch)
  } catch (err) {
    return next(err)
  }
}
