import type { Request, Response, NextFunction } from 'express'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = req.integration
    const repositoryId = req.params.repositoryId as string
    const page = Number(req.query.page || 1)
    const perPage = Number(req.query.perPage || 30)

    const tags = await GitProviderUtil.listTags(
      integration,
      decodeURIComponent(repositoryId),
      page,
      perPage,
    )

    return res.status(200).json(tags)
  } catch (err) {
    return next(err)
  }
}
