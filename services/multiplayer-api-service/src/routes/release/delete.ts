import type { Request, Response, NextFunction } from 'express'
import { ReleaseModel } from '@multiplayer/models'

export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    const releaseId = req.params.releaseId as string

    await ReleaseModel.deleteReleaseById(releaseId)

    return res.sendStatus(204)
  } catch (err) {
    return next(err)
  }
}
