import { NextFunction, Request, Response } from 'express'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = req.integration
    const repositoryId = req.params.repositoryId as string
    const branchName = req.params.branchName as string

    const branch = await GitProviderUtil.getBranch(
      integration,
      decodeURIComponent(repositoryId),
      branchName,
    )
    return res.status(200).json(branch)
  } catch (err) {
    return next(err)
  }
}
