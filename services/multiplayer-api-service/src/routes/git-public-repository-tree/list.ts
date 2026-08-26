import type { Request, Response, NextFunction } from 'express'
import {
  IntegrationTypeEnum,
} from '@multiplayer/types'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitProviderType = req.query.gitProviderType as IntegrationTypeEnum
    const path = req.params.path as string
    const gitPublicRepositoryId = decodeURIComponent(req.params.gitPublicRepositoryId as string)
    const ref = req.query.ref as string
    const page = String(req.query.page || '1')
    const perPage = Number(req.query.perPage || 30)

    const tree = await GitProviderUtil.getRepositoryTree(
      { type: gitProviderType },
      gitPublicRepositoryId,
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
