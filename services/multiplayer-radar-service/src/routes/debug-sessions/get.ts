import type { Request, Response, NextFunction } from 'express'
import { s3 } from '@multiplayer/s3'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const debugSession = req.debugSession

    const _debugSession = debugSession.toObject()

    _debugSession.s3Files = await Promise.all((_debugSession?.s3Files || [])
      .map(async s3File => ({
        ...s3File,
        url: await s3.getPresignedDownloadUrl(
          s3File.key,
          s3File.bucket,
        ),
      })))

    return res.status(200).json(_debugSession)
  } catch (err) {
    return next(err)
  }
}
