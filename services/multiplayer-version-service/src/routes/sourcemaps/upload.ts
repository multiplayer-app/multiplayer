import type { Request, Response, NextFunction } from 'express'
import { SourcemapService } from '../../services'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const release = req.release
    const { 'content-disposition': contentDisposition } = req.headers

    const filename = decodeURIComponent((contentDisposition as string).split('filename=')[1].replace(/"/g, ''))

    const { writeStream, promise } = await SourcemapService.uploadSourcemap(
      release,
      filename,
    )

    req.pipe(writeStream)

    await promise

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
