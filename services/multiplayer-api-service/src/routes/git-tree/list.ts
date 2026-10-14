import type { Request, Response, NextFunction } from 'express'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = req.integration
    const repositoryId = req.params.repositoryId as string
    const path = req.params.path as string

    const ref = req.query.ref as string
    const page = String(req.query.page || '1')
    const perPage = Number(req.query.perPage || 30)

    const tree = await GitProviderUtil.getRepositoryTree(
      integration,
      decodeURIComponent(repositoryId),
      ref,
      decodeURIComponent(path),
      page,
      perPage,
    )

    return res.status(200).json(tree)
  } catch (err) {
    return next(err)
  }
}
