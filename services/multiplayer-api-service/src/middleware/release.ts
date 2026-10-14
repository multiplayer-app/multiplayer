import type { Request, Response, NextFunction } from 'express'
import { ReleaseModel } from '@multiplayer/models'
import { NotFoundError } from 'restify-errors'
import { ErrorMessage } from '@multiplayer/types'

export const attachReleaseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const releaseId = req.params.releaseId as string

    const release = await ReleaseModel.findReleaseById(releaseId)

    if (!release) {
      return next(new NotFoundError(ErrorMessage.RELEASE_NOT_FOUND))
    }

    req.release = release

    next()
  } catch (err) {
    next(err)
  }
}
