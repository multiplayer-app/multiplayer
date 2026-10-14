import type { Request, Response, NextFunction } from 'express'
import { GitProviderUtil } from '../../util'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const integration = req.integration
    const repositoryId = req.params.repositoryId as string
    const path = req.params.path as string
    const ref = req.query.ref as string

    const fileName = decodeURIComponent(path).split('/').slice(-1)[0]

    const fileStream = await GitProviderUtil.getFileContents(
      integration,
      decodeURIComponent(repositoryId),
      ref,
      path,
    )

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`)

    fileStream.pipe(res)
  } catch (err) {
    return next(err)
  }
}
