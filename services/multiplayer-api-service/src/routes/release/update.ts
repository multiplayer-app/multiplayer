import type { Request, Response, NextFunction } from 'express'
import { ReleaseModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const releaseId = req.params.releaseId as string
    const payload = req.body

    const release = await ReleaseModel.updateReleaseById(releaseId, payload)

    return res.status(200).json(release)
  } catch (err) {
    return next(err)
  }
}
