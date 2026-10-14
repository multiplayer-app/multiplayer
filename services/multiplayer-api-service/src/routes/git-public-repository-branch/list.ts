import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationTypeEnum,
} from '@multiplayer/types'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitProviderType = req.query.gitProviderType as IntegrationTypeEnum
    const gitPublicRepositoryId = decodeURIComponent(req.params.gitPublicRepositoryId as string)
    const page = Number(req.query.page || 1)
    const perPage = Number(req.query.perPage || 30)

    const branches = await GitProviderUtil.listBranches(
      { type: gitProviderType },
      gitPublicRepositoryId,
      page,
      perPage,
    )

    return res.status(200).json(branches)
  } catch (err) {
    return next(err)
  }
}
