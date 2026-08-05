import type { NextFunction, Request, Response } from 'express'
import {
  IntegrationTypeEnum,
} from '@multiplayer/types'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gitProviderType = req.query.gitProviderType as IntegrationTypeEnum
    const branchName = req.params.branchName as string
    const gitPublicRepositoryId = decodeURIComponent(req.params.gitPublicRepositoryId as string)

    const branch = await GitProviderUtil.getBranch(
      { type: gitProviderType },
      gitPublicRepositoryId,
      branchName,
    )

    return res.status(200).json(branch)
  } catch (err) {
    return next(err)
  }
}
