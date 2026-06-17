import type { Request, Response, NextFunction } from 'express'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = req.integration
    const repositoryId = decodeURIComponent(req.params.repositoryId as string)
    const page = Number(req.query.page || 1)
    const perPage = Number(req.query.perPage || 30)

    const branches = await GitProviderUtil.listBranches(
      integration,
      repositoryId,
      page,
      perPage,
    )

    return res.status(200).json(branches)
  } catch (err) {
    return next(err)
  }
}
