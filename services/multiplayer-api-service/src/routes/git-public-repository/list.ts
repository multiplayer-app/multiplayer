import type { Request, Response, NextFunction } from 'express'
import { GitProviderUtil } from '../../util'
import {
  IntegrationTypeEnum,
} from '@multiplayer/types'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitProviderType = req.query.gitProviderType as IntegrationTypeEnum
    const repositoryName = req.query.repositoryName as string
    const page = Number(req.query.page || 1)
    const perPage = Number(req.query.perPage || 30)

    const repositories = await GitProviderUtil.listRepositories(
      { type: gitProviderType },
      page,
      perPage,
      repositoryName,
    )

    return res.status(200).json(repositories)
  } catch (err) {
    return next(err)
  }
}
