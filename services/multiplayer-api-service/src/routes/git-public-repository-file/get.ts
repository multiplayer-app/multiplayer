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

    const fileName = decodeURIComponent(path).split('/').slice(-1)[0]

    const fileStream = await GitProviderUtil.getFileContents(
      { type: gitProviderType },
      gitPublicRepositoryId,
      ref,
      path,
    )

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`)

    fileStream.pipe(res)
  } catch (err) {
    return next(err)
  }
}
